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
  | "upcoming"
  | "completed"
  | "cancelled";

export type BookingItem = {
  id: string;
  serviceName: string;
  amount: number;
  dateLabel: string;
  timeLabel: string;
  address: string;
  status: BookingStatus;

  // technician data once assigned
  otp?: string;
  technicianName?: string;
  technicianPhone?: string;
  technicianRating?: number;
};

type CreateBookingInput = {
  serviceName: string;
  amount: number;
  dateLabel: string;
  timeLabel: string;
  address: string;
};

type BookingContextType = {
  bookings: BookingItem[];

  // derived lists
  ongoing: BookingItem[];   // searching + assigned
  upcoming: BookingItem[];  // upcoming
  completed: BookingItem[];

  createBooking: (input: CreateBookingInput) => BookingItem;
  updateBooking: (id: string, patch: Partial<BookingItem>) => void;
  cancelBooking: (id: string) => void;
  getBookingById: (id: string) => BookingItem | null;
};

const BookingContext = createContext<BookingContextType | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);

  const createBooking: BookingContextType["createBooking"] = (input) => {
    const booking: BookingItem = {
      id: Date.now().toString(),
      serviceName: input.serviceName,
      amount: input.amount,
      dateLabel: input.dateLabel,
      timeLabel: input.timeLabel,
      address: input.address,
      status: "searching",
    };

    setBookings((prev) => [booking, ...prev]);
    return booking;
  };

  const updateBooking: BookingContextType["updateBooking"] = (id, patch) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  };

  const cancelBooking: BookingContextType["cancelBooking"] = (id) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "cancelled" } : b
      )
    );
  };

  const getBookingById: BookingContextType["getBookingById"] = (id) =>
    bookings.find((b) => b.id === id) ?? null;

  const ongoing = useMemo(
    () => bookings.filter((b) => b.status === "searching" || b.status === "assigned"),
    [bookings]
  );
  const upcoming = useMemo(
    () => bookings.filter((b) => b.status === "upcoming"),
    [bookings]
  );
  const completed = useMemo(
    () => bookings.filter((b) => b.status === "completed"),
    [bookings]
  );

  return (
    <BookingContext.Provider
      value={{
        bookings,
        ongoing,
        upcoming,
        completed,
        createBooking,
        updateBooking,
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
    throw new Error("useBooking must be used inside <BookingProvider />");
  }
  return ctx;
}
