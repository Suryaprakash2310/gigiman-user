import React, { createContext, useContext, useState } from "react";

export type BookingData = {
  id: string;
  serviceName: string;
  amount: string;
  date: string;
  time: string;
  technicianName?: string;
};

type BookingContextType = {
  ongoingBooking: BookingData | null;
  setOngoingBooking: (b: BookingData | null) => void;
};

const BookingContext = createContext<BookingContextType | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [ongoingBooking, setOngoingBooking] = useState<BookingData | null>(null);

  return (
    <BookingContext.Provider value={{ ongoingBooking, setOngoingBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be inside BookingProvider");
  return ctx;
}
