// src/store/recurringStore.ts
import { useState, useEffect } from 'react';
import { 
  RecurringPlan, 
  RecurringService, 
  RecurringFrequencyType, 
  CleanerPreferenceType, 
  PaymentMethodType, 
  ScheduleDetails 
} from '../types/recurring';
import { RecurringAPI } from '../api/recurring.api';

// Zustand-like custom store implementation to avoid React 19 / React Native 0.81 package conflicts
export function createStore<T>(
  initialStateCreator: (
    set: (updater: Partial<T> | ((state: T) => Partial<T>)) => void,
    get: () => T
  ) => T
) {
  let state: T;
  const listeners = new Set<() => void>();

  const set = (updater: Partial<T> | ((state: T) => Partial<T>)) => {
    const nextState = typeof updater === 'function' ? (updater as any)(state) : updater;
    state = { ...state, ...nextState };
    listeners.forEach(listener => listener());
  };

  const get = () => state;

  state = initialStateCreator(set, get);

  const useStore = <U>(selector: (state: T) => U = (s => s as any)): U => {
    const [, forceUpdate] = useState(0);

    useEffect(() => {
      const listener = () => forceUpdate(prev => prev + 1);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, []);

    return selector(state);
  };

  return Object.assign(useStore, {
    getState: get,
    setState: set,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  });
}

// ──────────────────────────────────────────────────────────────────────────
// INITIAL MOCK DATA
// ──────────────────────────────────────────────────────────────────────────

export const MOCK_SERVICES: RecurringService[] = [
  { id: '1', name: 'Home Cleaning', icon: 'home-outline', description: 'Complete dust & mop of all rooms.', pricePerVisit: 499 },
  { id: '2', name: 'Deep Cleaning', icon: 'sparkles-outline', description: 'Intense scrub & wash of entire home.', pricePerVisit: 1999 },
  { id: '3', name: 'Kitchen Cleaning', icon: 'restaurant-outline', description: 'Degreasing slabs, chimneys, and tiles.', pricePerVisit: 999 },
  { id: '4', name: 'Bathroom Cleaning', icon: 'water-outline', description: 'Limescale removal & floor sanitization.', pricePerVisit: 399 },
  { id: '5', name: 'Sofa Cleaning', icon: 'cube-outline', description: 'Vacuuming & shampooing of upholstery.', pricePerVisit: 799 },
  { id: '6', name: 'Carpet Cleaning', icon: 'grid-outline', description: 'Removal of stains & dust from rug fibers.', pricePerVisit: 699 },
];

const INITIAL_MOCK_PLANS: RecurringPlan[] = [
  {
    id: 'plan_101',
    service: MOCK_SERVICES[0], // Home Cleaning
    frequency: 'weekly',
    schedule: {
      weekdays: ['Mon'],
      time: '09:00 AM',
      startDate: '2026-08-03',
      isNoEndDate: true,
    },
    cleanerPreference: 'same-cleaner',
    paymentMethod: 'upi',
    pricePerVisit: 499,
    estimatedMonthlyCost: 1996, // 4 visits
    status: 'active',
    nextVisitDate: '10 Aug',
    upcomingVisits: [
      { id: 'v_1', date: '2026-08-10', time: '09:00 AM', status: 'scheduled' },
      { id: 'v_2', date: '2026-08-17', time: '09:00 AM', status: 'scheduled' },
      { id: 'v_3', date: '2026-08-24', time: '09:00 AM', status: 'scheduled' },
    ],
    paymentHistory: [
      { id: 'tx_1', date: '2026-07-27', amount: 499, status: 'paid', transactionId: 'TXN873918239' },
      { id: 'tx_2', date: '2026-07-20', amount: 499, status: 'paid', transactionId: 'TXN873911182' },
    ],
    bookingHistory: [
      { id: 'bk_1', date: '2026-07-27', time: '09:00 AM', cleanerName: 'Ramesh Kumar', status: 'completed' },
      { id: 'bk_2', date: '2026-07-20', time: '09:00 AM', cleanerName: 'Ramesh Kumar', status: 'completed' },
    ],
  },
  {
    id: 'plan_102',
    service: MOCK_SERVICES[2], // Kitchen Cleaning
    frequency: 'monthly',
    schedule: {
      monthlyType: 'date',
      dateOfMonth: 1,
      time: '11:00 AM',
      startDate: '2026-08-01',
      isNoEndDate: true,
    },
    cleanerPreference: 'best-available',
    paymentMethod: 'razorpay',
    pricePerVisit: 999,
    estimatedMonthlyCost: 999,
    status: 'paused',
    nextVisitDate: '01 Sep',
    upcomingVisits: [
      { id: 'v_4', date: '2026-09-01', time: '11:00 AM', status: 'scheduled' },
    ],
    paymentHistory: [
      { id: 'tx_3', date: '2026-08-01', amount: 999, status: 'paid', transactionId: 'TXN874011299' },
    ],
    bookingHistory: [
      { id: 'bk_3', date: '2026-08-01', time: '11:00 AM', cleanerName: 'Sunita Sharma', status: 'completed' },
    ],
  }
];

// ──────────────────────────────────────────────────────────────────────────
// STORE DEFINITION
// ──────────────────────────────────────────────────────────────────────────

export interface RecurringStore {
  plans: RecurringPlan[];
  draft: Partial<RecurringPlan>;
  
  // Actions
  updateDraft: (updates: Partial<RecurringPlan>) => void;
  resetDraft: () => void;
  createPlan: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  
  pausePlan: (planId: string) => Promise<void>;
  resumePlan: (planId: string) => Promise<void>;
  cancelPlan: (planId: string) => Promise<void>;
  skipNextVisit: (planId: string) => Promise<void>;
  reschedulePlan: (planId: string, date: string, time: string) => Promise<void>;
  editPlan: (planId: string, updates: Partial<RecurringPlan>) => Promise<void>;
}

export const useRecurringStore = createStore<RecurringStore>((set, get) => ({
  plans: [],
  draft: {},

  updateDraft: (updates) => {
    set((state) => ({
      draft: { ...state.draft, ...updates },
    }));
  },

  resetDraft: () => {
    set({ draft: {} });
  },

  fetchPlans: async () => {
    try {
      const plansData = await RecurringAPI.getPlans();
      if (plansData && plansData.length > 0) {
        const mappedPlans = (plansData || []).map((p: any) => {
          // Find matching service category from local MOCK_SERVICES list if possible, or fallback
          const serviceMatch = MOCK_SERVICES.find(s => 
            s.name.toLowerCase() === p.service?.name?.toLowerCase() ||
            p.serviceCategoryName?.toLowerCase() === s.name.toLowerCase()
          ) || MOCK_SERVICES[0];

          return {
            id: p._id || p.id,
            service: serviceMatch,
            frequency: p.frequency,
            schedule: {
              weekdays: p.schedule?.weekdays || [],
              monthlyType: p.schedule?.monthlyType || 'date',
              dateOfMonth: p.schedule?.dateOfMonth || 1,
              monthlyRule: p.schedule?.monthlyRule || 'First Monday',
              time: p.schedule?.time || '10:00 AM',
              startDate: p.schedule?.startDate || '',
              endDate: p.schedule?.endDate || null,
              isNoEndDate: p.schedule?.isNoEndDate !== false,
            },
            cleanerPreference: p.cleanerPreference || 'same-cleaner',
            paymentMethod: p.paymentMethod || 'upi',
            pricePerVisit: p.pricePerVisit || serviceMatch.pricePerVisit,
            estimatedMonthlyCost: p.estimatedMonthlyCost || (serviceMatch.pricePerVisit * 4),
            status: p.status || 'active',
            nextVisitDate: p.history?.find((h: any) => h.status === 'pending')?.date?.split(' (')[0] || '12 Aug',
            upcomingVisits: (p.history || []).map((h: any, i: number) => ({
              id: h._id || `v_${i}`,
              date: h.date,
              time: p.schedule?.time || '10:00 AM',
              status: h.status === 'pending' ? 'scheduled' : h.status
            })),
            paymentHistory: [],
            bookingHistory: []
          };
        });
        set({ plans: mappedPlans });
      }
    } catch (err) {
      console.warn('Failed to load plans from backend API. Using local mock data.', err);
    }
  },

  createPlan: async () => {
    const { draft, plans } = get();
    if (!draft.service || !draft.frequency || !draft.schedule) {
      console.warn('Cannot create plan: Draft is incomplete');
      return;
    }

    const basePrice = draft.service.pricePerVisit;
    let multiplier = 1;
    if (draft.frequency === 'weekly') multiplier = 4;
    else if (draft.frequency === 'every-2-weeks') multiplier = 2;
    else if (draft.frequency === 'monthly') multiplier = 1;

    const pricePerVisit = Math.round(basePrice * 0.9);
    const estimatedMonthlyCost = pricePerVisit * multiplier;

    const payload = {
      service: draft.service.id,
      frequency: draft.frequency,
      schedule: {
        weekdays: draft.schedule.weekdays || [],
        time: draft.schedule.time || '10 AM-12 PM',
        startDate: draft.schedule.startDate || '08 Aug 2026',
        isNoEndDate: draft.schedule.isNoEndDate !== false,
        endDate: draft.schedule.endDate || null,
        monthlyDay: draft.schedule.monthlyDay || null,
        customInterval: draft.schedule.customInterval || null,
        customUnit: draft.schedule.customUnit || null,
      },
      cleanerPreference: draft.cleanerPreference || 'same-cleaner',
      paymentMethod: draft.paymentMethod || 'upi',
      pricePerVisit,
      estimatedMonthlyCost,
      reminders: draft.reminders || { notify1Day: true, notify1Hour: true }
    };

    try {
      const response = await RecurringAPI.createPlan(payload);
      if (response && response.success) {
        // Reload from backend
        const store = get() as any;
        if (store.fetchPlans) {
          await store.fetchPlans();
        }
        set({ draft: {} });
        return response.data;
      }
    } catch (err) {
      console.warn('Failed to create plan on backend, falling back to local simulation:', err);
    }

    // Fallback: create locally
    const startDate = draft.schedule.startDate || new Date().toISOString().split('T')[0];
    const visitTime = draft.schedule.time || '10 AM-12 PM';
    const newPlan: RecurringPlan = {
      id: `plan_${Date.now()}`,
      service: draft.service,
      frequency: draft.frequency,
      schedule: {
        weekdays: draft.schedule.weekdays || [],
        time: visitTime,
        startDate: startDate,
        endDate: draft.schedule.endDate,
        isNoEndDate: draft.schedule.isNoEndDate,
      },
      cleanerPreference: draft.cleanerPreference || 'best-available',
      paymentMethod: draft.paymentMethod || 'upi',
      pricePerVisit,
      estimatedMonthlyCost,
      status: 'active',
      nextVisitDate: startDate.split(' (')[0],
      upcomingVisits: [
        { id: `v_${Date.now()}_1`, date: startDate, time: visitTime, status: 'scheduled' },
        { id: `v_${Date.now()}_2`, date: '22 Aug 2026', time: visitTime, status: 'scheduled' },
      ],
      paymentHistory: [],
      bookingHistory: [],
    };

    set({
      plans: [newPlan, ...plans],
      draft: {},
    });
    return newPlan;
  },

  pausePlan: async (planId) => {
    try {
      const response = await RecurringAPI.togglePausePlan(planId);
      if (response && response.success) {
        const store = get() as any;
        await store.fetchPlans();
        return;
      }
    } catch (err) {
      console.warn('Failed to pause plan on backend, pausing locally:', err);
    }

    set((state) => ({
      plans: state.plans.map((p) => 
        p.id === planId ? { ...p, status: 'paused' } : p
      ),
    }));
  },

  resumePlan: async (planId) => {
    try {
      const response = await RecurringAPI.togglePausePlan(planId);
      if (response && response.success) {
        const store = get() as any;
        await store.fetchPlans();
        return;
      }
    } catch (err) {
      console.warn('Failed to resume plan on backend, resuming locally:', err);
    }

    set((state) => ({
      plans: state.plans.map((p) => 
        p.id === planId ? { ...p, status: 'active' } : p
      ),
    }));
  },

  cancelPlan: async (planId) => {
    try {
      const response = await RecurringAPI.cancelPlan(planId);
      if (response && response.success) {
        const store = get() as any;
        await store.fetchPlans();
        return;
      }
    } catch (err) {
      console.warn('Failed to cancel plan on backend, cancelling locally:', err);
    }

    set((state) => ({
      plans: state.plans.map((p) => 
        p.id === planId ? { ...p, status: 'cancelled' } : p
      ),
    }));
  },

  skipNextVisit: async (planId) => {
    try {
      const response = await RecurringAPI.skipNextVisit(planId);
      if (response && response.success) {
        const store = get() as any;
        await store.fetchPlans();
        return;
      }
    } catch (err) {
      console.warn('Failed to skip next visit on backend, skipping locally:', err);
    }

    set((state) => ({
      plans: state.plans.map((p) => {
        if (p.id !== planId) return p;
        const upcoming = [...p.upcomingVisits];
        if (upcoming.length > 0) {
          upcoming[0] = { ...upcoming[0], status: 'skipped' };
        }
        upcoming.push({
          id: `v_skip_${Date.now()}`,
          date: '29 Aug 2026',
          time: p.schedule.time,
          status: 'scheduled'
        });
        return {
          ...p,
          upcomingVisits: upcoming,
          nextVisitDate: '22 Aug',
        };
      }),
    }));
  },

  reschedulePlan: async (planId, date, time) => {
    try {
      const response = await RecurringAPI.updatePlan(planId, {
        schedule: {
          startDate: date,
          time: time
        }
      });
      if (response && response.success) {
        const store = get() as any;
        await store.fetchPlans();
        return;
      }
    } catch (err) {
      console.warn('Failed to reschedule plan on backend, updating locally:', err);
    }

    set((state) => ({
      plans: state.plans.map((p) => {
        if (p.id !== planId) return p;
        const upcoming = [...p.upcomingVisits];
        if (upcoming.length > 0) {
          upcoming[0] = { ...upcoming[0], date, time };
        }
        const cleanDate = date.split(' ')[0] || date;
        return {
          ...p,
          schedule: { ...p.schedule, time },
          upcomingVisits: upcoming,
          nextVisitDate: cleanDate,
        };
      }),
    }));
  },

  editPlan: async (planId, updates) => {
    try {
      const payload = {
        frequency: updates.frequency,
        schedule: updates.schedule,
        cleanerPreference: updates.cleanerPreference,
        paymentMethod: updates.paymentMethod,
        pricePerVisit: updates.pricePerVisit,
        estimatedMonthlyCost: updates.estimatedMonthlyCost
      };
      const response = await RecurringAPI.updatePlan(planId, payload);
      if (response && response.success) {
        const store = get() as any;
        await store.fetchPlans();
        return;
      }
    } catch (err) {
      console.warn('Failed to edit plan on backend, editing locally:', err);
    }

    set((state) => ({
      plans: state.plans.map((p) => 
        p.id === planId ? { ...p, ...updates } : p
      ),
    }));
  },
}));
