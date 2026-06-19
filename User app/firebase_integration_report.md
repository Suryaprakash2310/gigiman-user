# Firebase Integration Audit Report

I have carefully audited both the **Backend** and the **Frontend (Mobile App)** codebases to check the current state of the Firebase authentication integration. 

Based on my analysis, the **Firebase Authentication flow is currently disabled and bypassed** across both the frontend and backend. The application is currently using a mock/local OTP flow. 

Here are the specific findings:

### 1. Backend Findings
* **Verification is Commented Out**: In `backend/controllers/auth.controller.js` and `backend/controllers/user.controller.js`, the code intended to verify the Firebase ID Token is explicitly commented out:
  ```javascript
  // Verify the SMS OTP via Firebase Token
  // const decodedToken = await verifyFirebaseToken(firebaseToken);
  ```
* **Relying on Local OTP Generation**: The `sendOtp` controller bypasses any external SMS provider and instead manually generates a 6-digit OTP, saves it locally to the MongoDB `Otp` collection, and passes it directly in the response to the client.
* **Verifying Local OTP**: The `verifyOtp` endpoint ignores any `firebaseToken` input. Instead, it checks the provided `otp` against the local database: 
  ```javascript
  const otpRecord = await Otp.findOne({ cleanPhone });
  if (otpRecord.otp !== parseInt(otp)) { ... }
  ```

### 2. Frontend Findings
* **Missing Firebase SDK Calls**: The client code (e.g., `PhoneNumber.tsx` and `OtpLogin.tsx`) does not utilize the Firebase Mobile SDK (like `auth().signInWithPhoneNumber()`) to generate or capture SMS verification codes.
* **Missing `firebaseToken` Payload**: In `api/auth.ts`, the frontend API binding for `verifyOtp` only transmits the `phoneNo` and `otp` fields to the backend. It does not look for or send a `firebaseToken`.
* **Auto-Prefill Mock Flow**: When `sendOtp` is called in `PhoneNumber.tsx`, it extracts the mock OTP from the backend's response and directly forwards it to the OTP screen where it is auto-filled for the user: 
  ```typescript
  const res = await AuthAPI.sendOtp(phone.trim());
  navigation.navigate('otp', { phone, otp: res.otp }); // Auto-fill
  ```

### Conclusion
Currently, Firebase is **not functioning** as the OTP or Authentication mechanism for the application. The system has reverted to a simulated local OTP pipeline where the server generates the code, gives it straight to the UI, and verifies it back locally without generating an actual SMS or verifying a cryptographic Firebase ID token.

### Recommended Next Steps to Re-integrate Firebase:
1. **Frontend**: Re-implement `@react-native-firebase/auth`. The `PhoneNumber.tsx` should use `signInWithPhoneNumber(phone)` to trigger the real SMS, and `OtpLogin.tsx` should submit the SMS code to Firebase to obtain the final `firebaseToken` (ID Token).
2. **Frontend**: Update `AuthAPI.verifyOtp` to pass the generated `firebaseToken` to the backend. 
3. **Backend**: Uncomment `verifyFirebaseToken(firebaseToken)` in your controllers.
4. **Backend**: Remove the local MongoDB `Otp` model checks (`generate OTP`, `Otp.findOne`), as Firebase entirely assumes responsibility for issuing and verifying the codes.
