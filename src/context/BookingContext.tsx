import { socket } from "@/src/socket/socket";
import { mapBookingToBookingItem } from "@/src/utils/mapBooking";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BookingAPI } from "../api/booking.api";

/* ============================= */
/*          STATUS TYPE          */
/* ============================= */

export type BookingStatus =
  | "scheduled"
  | "searching"
  | "otp"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "assigned";
/* ============================= */
/*          BOOKING TYPE         */
/* ============================= */
export type BookingItem = {
  _id: string;
  serviceCategoryName: string;
  address: string;
  status: BookingStatus;
  totalPrice?: number;
  isScheduled?: boolean;
  scheduleDateTime?: string;
  name?: string;
  rating?: number;
  otp?: string;
  dateLabel?: string;
  timeLabel?: string;
  durationInMinutes?: number;
  pendingServiceProposal?: ServiceProposal | null;
};

export type ServiceProposal = {
  serviceCategoryId: string;
  serviceCategoryName: string;
  price: number;
  durationInMinutes: number;
  employeeCount: number;
  proposedAt: string;
};

/* ============================= */
/*        CONTEXT TYPE           */
/* ============================= */

type BookingContextType = {
  bookings: BookingItem[];
  ongoing: BookingItem[];
  upcoming: BookingItem[];

  upsertBooking: (booking: BookingItem) => void;
  updateStatus: (id: string, status: BookingStatus) => void;
  cancelBooking: (id: string) => void;
  getBookingById: (id: string) => BookingItem | null;

  getLatestActiveBooking: () => BookingItem | null;
  activeBookings: BookingItem[];
};

const BookingContext = createContext<BookingContextType | null>(null);

/* ============================= */
/*        PROVIDER               */
/* ============================= */

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  useEffect(() => {
    const onServicerAccepted = ({ booking, otp }: any) => {
      console.log("🔥 SERVICER ACCEPTED (GLOBAL):", booking._id);

      const mapped = mapBookingToBookingItem(booking, otp);
      upsertBooking(mapped);
    };

    socket.on("servicer-accepted", onServicerAccepted);

    return () => {
      socket.off("servicer-accepted", onServicerAccepted);
    };
  }, []);

  useEffect(() => {
    const onServiceProposed = ({ bookingId, proposal }: any) => {
      console.log("🧠 SERVICE PROPOSED:", bookingId);

      setBookings(prev =>
        prev.map(b =>
          b._id === bookingId
            ? { ...b, pendingServiceProposal: proposal }
            : b
        )
      );
    };

    socket.on("service-proposed", onServiceProposed);

    return () => {
      socket.off("service-proposed", onServiceProposed);
    };
  }, []);
  useEffect(() => {
    const onServiceApproved = ({ bookingId, totalPrice, service }: any) => {
      console.log("🎉 Service approved confirmed:", bookingId);

      setBookings(prev =>
        prev.map(b =>
          b._id === bookingId
            ? {
              ...b,
              pendingServiceProposal: null,
              totalPrice,
              serviceCategoryName: service,
              status: "assigned",
            }
            : b
        )
      );
    };

    socket.on("service-approved", onServiceApproved);

    return () => {
      socket.off("service-approved", onServiceApproved);
    };
  }, []);

  useEffect(() => {
    const fetchInitialBookings = async () => {
      try {
        const [active, scheduled] = await Promise.all([
          BookingAPI.getActiveBookings(),
          BookingAPI.getScheduledBookings()
        ]);

        const activeMapped = (active || []).map((b: any) => mapBookingToBookingItem(b));
        const scheduledMapped = (scheduled || []).map((b: any) => mapBookingToBookingItem(b));

        activeMapped.forEach(upsertBooking);
        scheduledMapped.forEach(upsertBooking);
      } catch (err) {
        console.warn("Failed to fetch initial bookings:", err);
      }
    };

    fetchInitialBookings();
  }, []);

  /* ----------------------------- */
  /* SINGLE SOURCE OF TRUTH        */
  /* ----------------------------- */

  const upsertBooking = (booking: BookingItem) => {
    setBookings(prev => {
      const exists = prev.find(b => b._id === booking._id);
      if (exists) {
        return prev.map(b =>
          b._id === booking._id
            ? {
              ...b,       // Preserve existing fields (name, price, etc.)
              ...booking, // Apply updates
              otp: booking.otp ?? b.otp // Ensure OTP is preserved/updated
            }
            : b
        );
      }
      return [booking, ...prev];
    });
  };

  const updateStatus = (id: string, status: BookingStatus) => {
    setBookings(prev =>
      prev.map(b =>
        b._id === id ? { ...b, status } : b
      )
    );
  };

  const cancelBooking = (id: string) => {
    updateStatus(id, "cancelled");
  };

  const getBookingById = (id: string) =>
    bookings.find(b => b._id === id) ?? null;

  /* ============================= */
  /*            FILTERS            */
  /* ============================= */

  const upcoming = useMemo(
    () =>
      bookings.filter(
        b =>
          b.isScheduled &&
          b.status === "scheduled" &&
          b.scheduleDateTime &&
          new Date(b.scheduleDateTime) > new Date()
      ),
    [bookings]
  );

  const ongoing = useMemo(
    () =>
      bookings.filter(
        b =>
          ["searching", "otp", "in_progress", "assigned"].includes(b.status)
      ),
    [bookings]
  );

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        b =>
          ["searching", "otp", "in_progress", "assigned"].includes(b.status)
      ),
    [bookings]
  );
  /* ============================= */
  /*     LATEST ACTIVE BOOKING     */
  /* ============================= */

  const getLatestActiveBooking = () => {
    if (activeBookings.length === 0) return null;
    return activeBookings[0];
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        ongoing,
        upcoming,
        upsertBooking,
        updateStatus,
        cancelBooking,
        getBookingById,
        getLatestActiveBooking,
        activeBookings,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

/* ============================= */
/*           HOOK                */
/* ============================= */

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBooking must be used inside BookingProvider");
  }
  return ctx;
}