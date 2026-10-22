// src/types/recurring.ts

export interface RecurringService {
  id: string;
  name: string;
  icon: string; // Ionicons name
  description: string;
  pricePerVisit: number;
}

export type RecurringFrequencyType = 'everyday' | 'custom' | 'weekly' | 'every-2-weeks' | 'monthly';

export type CleanerPreferenceType = 'same-cleaner' | 'best-available' | 'professional-team';

export type PaymentMethodType = 'razorpay' | 'upi';

export interface ScheduleDetails {
  weekdays?: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  monthlyType?: 'date' | 'rule'; // date = 1-31, rule = e.g., "First Monday"
  dateOfMonth?: number; // 1-31
  monthlyRule?: string; // e.g. "First Monday", "Second Saturday", "Last Sunday"
  time: string; // e.g. "10:00 AM"
  startDate: string; // e.g. "2026-08-05"
  endDate?: string; // e.g. "2026-12-31"
  isNoEndDate?: boolean;
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
