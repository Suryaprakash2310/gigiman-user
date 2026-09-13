// src/types/recurring.ts

export interface RecurringService {
  id: string;
  name: string;
  icon: string; // Ionicons name
  description: string;
  pricePerVisit: number;
}

export type RecurringFrequencyType = 'weekly' | 'every-2-weeks' | 'monthly' | 'custom';

export type CleanerPreferenceType = 'same-cleaner' | 'best-available' | 'professional-team';

export type PaymentMethodType = 'upi' | 'razorpay';

export interface ScheduleDetails {
  weekdays?: string[]; // e.g. ["Mon", "Wed"]
  monthlyType?: 'date' | 'rule'; // date = 1-31, rule = e.g., "First Monday"
  dateOfMonth?: number; // 1-31
  monthlyRule?: string; // e.g. "First Monday", "Second Saturday", "Last Sunday"
  time: string; // e.g. "9:00 AM" or "09:00"
  startDate: string; // e.g. "2026-08-05"
  endDate?: string; // e.g. "2026-12-31"
  isNoEndDate: boolean;
  monthlyDay?: number;
  customInterval?: number;
  customUnit?: 'days' | 'weeks' | 'months';
}

export interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'failed' | 'pending';
  transactionId: string;
}

export interface BookingHistoryItem {
  id: string;
  date: string;
  time: string;
  cleanerName: string;
  status: 'completed' | 'skipped' | 'rescheduled' | 'cancelled';
}

export interface UpcomingVisit {
  id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'skipped';
}

export interface RecurringPlan {
  id: string;
  service: RecurringService;
  frequency: RecurringFrequencyType;
  schedule: ScheduleDetails;
  cleanerPreference: CleanerPreferenceType;
  paymentMethod: PaymentMethodType;
  pricePerVisit: number;
  estimatedMonthlyCost: number;
  status: 'active' | 'paused' | 'cancelled';
  nextVisitDate: string; // e.g. "12 Aug"
  upcomingVisits: UpcomingVisit[];
  paymentHistory: PaymentHistoryItem[];
  bookingHistory: BookingHistoryItem[];
  reminders?: {
    notify1Day: boolean;
    notify1Hour: boolean;
  };
}
