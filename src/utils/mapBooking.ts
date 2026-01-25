// utils/mapBooking.ts
import { BookingItem } from "@/src/context/BookingContext";

export function mapBookingToBookingItem(booking: any, otp?: number): BookingItem {
  if (!booking || !booking._id) {
    throw new Error("Invalid booking object received in mapper");
  }

  return { 
    
    _id: booking._id,

  serviceName: booking.serviceCategoryName,
  amount: booking.totalPrice,

  dateLabel: booking.scheduleDateTime
    ? new Date(booking.scheduleDateTime).toLocaleDateString()
    : "",

  timeLabel: booking.scheduleDateTime
    ? new Date(booking.scheduleDateTime).toLocaleTimeString()
    : "",

  address: booking.address,

  status: booking.status,

  otp: otp ?? booking.StartWorkOTP,

  technicianName: booking.primaryEmployee?.fullname,
  technicianPhone: booking.primaryEmployee?.phoneNo,
  technicianRating: booking.primaryEmployee?.rating,
};}
