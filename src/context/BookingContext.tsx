import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
} from "react";

export type BookingStatus =
  | "searching"
  | "assigned"
  | "scheduled"
  | "completed"
  | "cancelled";

export type BookingItem = {
  _id: string;
  serviceCategoryName: string;
  amount?: number;
  dateLabel: string;
  timeLabel: string;
  address: string;
  status: BookingStatus;
  otp?: string;
  technicianName?: string;
  technicianPhone?: string;
  technicianRating?: number;
  totalPrice?: number;

  
  isScheduled?: boolean;
  scheduleDateTime?: string;
};

type BookingContextType = {
  bookings: BookingItem[];
  ongoing: BookingItem[];
  upcoming: BookingItem[];
  completed: BookingItem[];
  upsertBooking: (booking: BookingItem) => void;
  cancelBooking: (id: string) => void;
  getBookingById: (id: string) => BookingItem | null;
};

const BookingContext = createContext<BookingContextType | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);

  /** ✅ SINGLE SOURCE OF TRUTH */
  const upsertBooking = (booking: BookingItem) => {
    setBookings(prev => {
      const exists = prev.find(b => b._id === booking._id);
      if (exists) {
        return prev.map(b =>
          b._id === booking._id ? booking : b
        );
      }
      return [booking, ...prev];
    });
  };

  const cancelBooking = (id: string) => {
    setBookings(prev =>
      prev.map(b =>
        b._id === id ? { ...b, status: "cancelled" } : b
      )
    );
  };

  const getBookingById = (id: string) =>
    bookings.find(b => b._id === id) ?? null;

  // const ongoing = useMemo(
  //   () => bookings.filter(b =>
  //     b.status === "searching" || b.status === "assigned"
  //   ),
  //   [bookings]
  // );

  // const upcoming = useMemo(
  //   () => bookings.filter(b => b.status === "upcoming"),
  //   [bookings]
  // );

  const now = new Date();

const upcoming = useMemo(
  () => bookings.filter(b => b.status === "scheduled"),
  [bookings]
);

const ongoing = useMemo(
  () =>
    bookings.filter(b =>
      !b.isScheduled ||
      !b.scheduleDateTime ||
      new Date(b.scheduleDateTime) <= now
    ).filter(
      b => b.status === "searching" || b.status === "assigned"
    ),
  [bookings]
);


/* future use this  
const ongoing = useMemo(
  () =>
    bookings.filter(
      b => b.status === "searching" || b.status === "assigned"
    ),
  [bookings]
);*/

  const completed = useMemo(
    () => bookings.filter(b => b.status === "completed"),
    [bookings]
  );

  return (
    <BookingContext.Provider
      value={{
        bookings,
        ongoing,
        upcoming,
        completed,
        upsertBooking,
        cancelBooking,
        getBookingById,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBooking must be used inside BookingProvider");
  }
  return ctx;
}
