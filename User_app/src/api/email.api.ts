import { api } from './client';

/**
 * Ask the backend to generate an OTP and send it to the given email
 * via Mailjet. The OTP is stored server-side with a TTL.
 */
export const sendEmailOtpAPI = (email: string) =>
  api.post('/user/send-email-otp', { email });

/**
 * Verify the 6-digit OTP the user received in their inbox.
 * Returns { success: true } on match, throws on mismatch / expiry.
 */
export const verifyEmailOtpAPI = (email: string, otp: string) =>
  api.post('/user/verify-email-otp', { email, otp });
