import { socket } from "@/src/socket/socket";
import { mapBookingToBookingItem } from "@/src/utils/mapBooking";
import { useAuthContext } from "@/src/context/AuthContext";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  | "assigned"
  | "manual_assign";
/* ============================= */
/*          BOOKING TYPE         */
/* ============================= */
export type BookingItem = {
  _id: string;
  serviceCategoryName: string;
  address: string;
  status: BookingStatus;
  totalPrice?: number;
  domainService?: string;
  isScheduled?: boolean;
  scheduleDateTime?: string;
  name?: string;
  rating?: number;
  reviews?: number;
  otp?: string;
  dateLabel?: string;
  timeLabel?: string;
  durationInMinutes?: number;
  pendingServiceProposal?: ServiceProposal | null;
  extraServices?: {
    _id: string;
    serviceName: string;
    price: number;
    status: string;
  }[];
  paymentStatus?: string;
  assignmentStatus?: string;
  paymentType?: string;
  advanceAmount?: number;
  remainingAmount?: number;
  rawStatus?: string;
  image?: string;
  isManuallyAssigned?: boolean;
  phone?: string;
  eta?: string;
  primaryEmployee?: any;
  servicerCompany?: any;
  cartItems?: {
    _id?: string;
    serviceCategoryId: string;
    serviceCategoryName: string;
    price: number;
    durationInMinutes?: number;
    employeeCount?: number;
    quantity: number;
  }[];
};

export type ServiceProposal = {
  _id?: string;
  serviceCategoryId: string;
  serviceCategoryName: string;
  serviceName?: string;
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
  manualBookings: BookingItem[];

  upsertBooking: (booking: BookingItem) => void;
  updateBookingItem: (id: string, updates: Partial<BookingItem>) => void;
  updateStatus: (id: string, status: BookingStatus) => void;
  cancelBooking: (id: string) => void;
  getBookingById: (id: string) => BookingItem | null;

  getLatestActiveBooking: () => BookingItem | null;
  activeBookings: BookingItem[];
  resetBookings: () => void;
  refreshBookings: () => Promise<void>;
};

const BookingContext = createContext<BookingContextType | null>(null);

/* ============================= */
/*        PROVIDER               */
/* ============================= */

export function BookingProvider({ children }: { children: ReactNode }) {
  const [rawBookings, setRawBookings] = useState<BookingItem[]>([]);
  const [manualAssignments, setManualAssignments] = useState<Record<string, Partial<BookingItem>>>({});

  const bookings = useMemo(() => {
    return rawBookings.map(b => {
      const saved = manualAssignments[b._id];
      if (saved) {
        return {
          ...b,
          ...saved,
          name: b.name || saved.name,
          phone: b.phone || saved.phone,
          otp: b.otp || saved.otp,
          status: (b.status === "manual_assign" || b.assignmentStatus === "FAILED") ? (saved.status || b.status) : b.status,
          isManuallyAssigned: b.isManuallyAssigned || saved.isManuallyAssigned,
          eta: b.eta || saved.eta,
          image: b.image || saved.image,
          rating: b.rating || saved.rating,
          reviews: b.reviews || saved.reviews,
        };
      }
      return b;
    });
  }, [rawBookings, manualAssignments]);

  const { accessToken, user } = useAuthContext();

  // Load manual assignments from AsyncStorage on mount / auth change
  useEffect(() => {
    const loadManualAssignments = async () => {
      try {
        const stored = await AsyncStorage.getItem("gg_manual_assignments");
        if (stored) {
          setManualAssignments(JSON.parse(stored));
        }
      } catch (err) {
        console.warn("Failed to load manual assignments:", err);
      }
    };
    if (accessToken) {
      loadManualAssignments();
    }
  }, [accessToken]);

  // Sync manual assignments on rawBookings changes (without deleting saved assignments)
  useEffect(() => {
    const updateStorage = async () => {
      try {
        const stored = await AsyncStorage.getItem("gg_manual_assignments");
        const current = stored ? JSON.parse(stored) : {};
        let changed = false;

        for (const b of rawBookings) {
          if (b.status === "completed" || b.status === "cancelled") {
            if (current[b._id]) {
              delete current[b._id];
              changed = true;
            }
          } else if (b.isManuallyAssigned || (b.name && ["assigned", "otp", "in_progress"].includes(b.status))) {
            const existing = current[b._id];
            if (!existing || existing.name !== b.name || existing.status !== b.status || existing.otp !== b.otp) {
              current[b._id] = {
                _id: b._id,
                name: b.name,
                phone: b.phone,
                otp: b.otp,
                status: b.status,
                isManuallyAssigned: true,
                eta: b.eta,
                image: b.image,
                rating: b.rating,
                reviews: b.reviews,
                primaryEmployee: b.primaryEmployee,
                servicerCompany: b.servicerCompany,
              };
              changed = true;
            }
          } else if (current[b._id]) {
            const existing = current[b._id];

            // Ignore backend rollback for manually assigned bookings
            if (
              existing.isManuallyAssigned &&
              (b.status === "manual_assign" || b.assignmentStatus === "FAILED")
            ) {
              continue;
            }

            if (existing.status !== b.status) {
              current[b._id] = {
                ...existing,
                status: b.status,
              };
              changed = true;
            }
          }
        }

        if (changed) {
          await AsyncStorage.setItem("gg_manual_assignments", JSON.stringify(current));
          setManualAssignments(current);
        }
      } catch (err) {
        console.warn("Error updating manual assignments storage:", err);
      }
    };

    if (rawBookings.length > 0) {
      updateStorage();
    }
  }, [rawBookings]);


  const upsertBooking = React.useCallback((booking: BookingItem) => {
    if (!booking || !booking._id) return;
    const targetId = String(booking._id);
    setRawBookings(prev => {
      if (!prev.length) return [booking];

      const exists = prev.find(b => String(b._id) === targetId);

      if (exists) {
        return prev.map(b => {
          if (String(b._id) !== targetId) return b;

          const mergedExtraServices =
            booking.extraServices !== undefined && Array.isArray(booking.extraServices)
              ? booking.extraServices.length > 0 || !Array.isArray(b.extraServices)
                ? booking.extraServices
                : b.extraServices
              : b.extraServices;

          const mergedCartItems =
            booking.cartItems !== undefined && Array.isArray(booking.cartItems)
              ? booking.cartItems.length > 0 || !Array.isArray(b.cartItems)
                ? booking.cartItems
                : b.cartItems
              : b.cartItems;

          return {
            ...b,
            ...booking,
            extraServices: mergedExtraServices,
            cartItems: mergedCartItems,
            serviceCategoryName: booking.serviceCategoryName || b.serviceCategoryName,
            address: booking.address || b.address,
            totalPrice:
              booking.totalPrice !== undefined && booking.totalPrice !== 0
                ? booking.totalPrice
                : (b.totalPrice ?? booking.totalPrice),
            remainingAmount:
              booking.remainingAmount !== undefined
                ? booking.remainingAmount
                : b.remainingAmount,
            advanceAmount:
              booking.advanceAmount !== undefined
                ? booking.advanceAmount
                : b.advanceAmount,
            durationInMinutes:
              booking.durationInMinutes !== undefined && booking.durationInMinutes !== 0
                ? booking.durationInMinutes
                : (b.durationInMinutes ?? booking.durationInMinutes),
            otp: booking.otp ?? b.otp,
            name: booking.name || b.name,
            phone: booking.phone || b.phone,
            image: booking.image || b.image,
            rating: booking.rating ?? b.rating,
            reviews: booking.reviews ?? b.reviews,
            pendingServiceProposal:
              booking.pendingServiceProposal !== undefined
                ? booking.pendingServiceProposal
                : b.pendingServiceProposal,
          };
        });
      }

      return [booking, ...prev];
    });
  }, []);


  useEffect(() => {
    const onServiceProposed = ({ bookingId, proposal }: any) => {
      if (!bookingId) return;
      setRawBookings(prev =>
        prev.map(b =>
          String(b._id) === String(bookingId)
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
      if (!bookingId) return;
      setRawBookings(prev =>
        prev.map(b =>
          String(b._id) === String(bookingId)
            ? {
              ...b,
              pendingServiceProposal: null,
              totalPrice: totalPrice ?? b.totalPrice,
              serviceCategoryName: service || b.serviceCategoryName,
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

  const fetchInitialBookings = React.useCallback(async () => {
    try {
      const [active, scheduled] = await Promise.all([
        BookingAPI.getActiveBookings(),
        BookingAPI.getScheduledBookings()
      ]);

      const activeMapped = (active || []).map((b: any) => mapBookingToBookingItem(b));
      const scheduledMapped = (scheduled || []).map((b: any) => mapBookingToBookingItem(b));

      setRawBookings([...activeMapped, ...scheduledMapped]);
    } catch (err) {
      console.warn("Booking fetch failed:", err);
    }
  }, []);

  const refreshBookings = React.useCallback(async () => {
    if (!accessToken || !user?.isVerified) return;
    await fetchInitialBookings();
  }, [accessToken, user, fetchInitialBookings]);

  useEffect(() => {
    // ⛔ Only fetch for fully verified users.
    // A new user receives a tempToken BEFORE profile completion.
    // Without this guard, the fetch fires with the tempToken, gets a 401,
    // which triggers FORCE_LOGOUT and sends the user back to the slider.
    if (!accessToken || !user?.isVerified) return;

    setRawBookings([]); // 🔥 clear old user data first
    fetchInitialBookings();
  }, [accessToken, user, fetchInitialBookings]);

  /* ----------------------------- */
  /* SINGLE SOURCE OF TRUTH        */
  /* ----------------------------- */


  const updateBookingItem = (id: string, updates: Partial<BookingItem>) => {
    if (!id) return;
    const targetId = String(id);
    setRawBookings(prev =>
      prev.map(b => {
        if (String(b._id) !== targetId) return b;

        const mergedExtraServices =
          updates.extraServices !== undefined
            ? Array.isArray(updates.extraServices)
              ? updates.extraServices
              : b.extraServices
            : b.extraServices;

        const mergedCartItems =
          updates.cartItems !== undefined
            ? Array.isArray(updates.cartItems)
              ? updates.cartItems
              : b.cartItems
            : b.cartItems;

        return {
          ...b,
          ...updates,
          extraServices: mergedExtraServices,
          cartItems: mergedCartItems,
          totalPrice: updates.totalPrice !== undefined ? updates.totalPrice : b.totalPrice,
          remainingAmount:
            updates.remainingAmount !== undefined ? updates.remainingAmount : b.remainingAmount,
          advanceAmount:
            updates.advanceAmount !== undefined ? updates.advanceAmount : b.advanceAmount,
          durationInMinutes:
            updates.durationInMinutes !== undefined ? updates.durationInMinutes : b.durationInMinutes,
          otp: updates.otp ?? b.otp,
        };
      })
    );
  };

  const updateStatus = (id: string, status: BookingStatus) => {
    updateBookingItem(id, { status });
  };

  const cancelBooking = (id: string) => {
    updateStatus(id, "cancelled");
  };

  const getBookingById = (id: string) => {
    if (!id) return null;
    const targetId = String(id);
    return bookings.find(b => String(b._id) === targetId) ?? null;
  };

  const resetBookings = () => {
    setRawBookings([]);
  };

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
          ["searching", "otp", "in_progress", "assigned"].includes(b.status) &&
          !(b.status === "assigned" && b.isManuallyAssigned) &&
          (b.assignmentStatus !== "FAILED" || b.isManuallyAssigned || !!b.primaryEmployee || !!b.servicerCompany)
      ),
    [bookings]
  );

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        b =>
          ["searching", "otp", "in_progress", "assigned"].includes(b.status) &&
          !(b.status === "assigned" && b.isManuallyAssigned) &&
          (b.assignmentStatus !== "FAILED" || b.isManuallyAssigned || !!b.primaryEmployee || !!b.servicerCompany)
      ),
    [bookings]
  );

  const manualBookings = useMemo(
    () =>
      bookings.filter(
        b =>
          b.status !== "completed" &&
          b.status !== "cancelled" &&
          (
            ((b.assignmentStatus === "FAILED" || b.status === "manual_assign") &&
              !b.isManuallyAssigned &&
              !b.primaryEmployee &&
              !b.servicerCompany) ||
            (b.status === "assigned" && b.isManuallyAssigned)
          )
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
        manualBookings,
        upsertBooking,
        updateBookingItem,
        updateStatus,
        cancelBooking,
        getBookingById,
        getLatestActiveBooking,
        activeBookings,
        resetBookings,
        refreshBookings,
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