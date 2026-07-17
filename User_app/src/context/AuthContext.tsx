import { socket } from "@/src/socket/socket";
import { getAuth, signOut } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from "react-native";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { isAxiosError } from 'axios';
import { ProfileAPI } from '../api/profile.api';

export type AuthUser = {
  _id: string;
  fullName?: string;
  email?: string;
  phone: string;
  avatar?: string;
  address?: string;
  isVerified?: boolean;
  profileCompleted?: boolean;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
};

type AuthContextType = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  login: (params: {
    user: AuthUser;
    accessToken: string;
    refreshToken?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const ACCESS_KEY = 'gg_access_token';
const REFRESH_KEY = 'gg_refresh_token';
const USER_KEY = 'gg_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🚪 Logout
  const logout = async () => {
    DeviceEventEmitter.emit("RESET_BOOKINGS");

    //socket.removeAllListeners();
    socket.disconnect();

    try {
      await signOut(getAuth());
    } catch (e) {
      console.error("Firebase signout error:", e);
    }


    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);

    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(ACCESS_KEY);
    await AsyncStorage.removeItem(REFRESH_KEY);
  };

  // 🔁 Restore session
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(USER_KEY);
        const savedAccess = await AsyncStorage.getItem(ACCESS_KEY);
        const savedRefresh = await AsyncStorage.getItem(REFRESH_KEY);

        if (savedAccess) {
          try {
            // Verify session validity with backend
            const res = await ProfileAPI.getProfileAPI();
            if (res && res.success && res.user) {
              const parsedUser = savedUser ? JSON.parse(savedUser) : {};
              const updatedUser: AuthUser = {
                ...parsedUser,
                _id: res.user._id || parsedUser._id || '',
                fullName: res.user.fullName || res.user.name || parsedUser.fullName,
                email: res.user.email || parsedUser.email,
                phone: res.user.phoneNo || parsedUser.phone || '',
                avatar: res.user.avatar || parsedUser.avatar || undefined,
                isVerified: true,
                profileCompleted: true,
              };
              setUser(updatedUser);
              setAccessToken(savedAccess);
              if (savedRefresh) setRefreshToken(savedRefresh);
              await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            } else {
              //console.warn('Backend session verification failed, logging out.');
              await logout();
            }
          } catch (apiErr) {
            //console.error('Session validation error:', apiErr);
            // Check if it's a 401 or 403 unauthorized error
            if (isAxiosError(apiErr) && (apiErr.response?.status === 401 || apiErr.response?.status === 403)) {
              await logout();
            } else {
              // Network/server error: fallback to cached offline state
              if (savedUser) setUser(JSON.parse(savedUser));
              setAccessToken(savedAccess);
              if (savedRefresh) setRefreshToken(savedRefresh);
            }
          }
        }
      } catch (err) {
        console.error('Auth restore failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // 🔊 Listen to FORCE_LOGOUT events
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('FORCE_LOGOUT', async () => {
      await logout();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 🔐 Login
  const login: AuthContextType['login'] = async ({
    user,
    accessToken,
    refreshToken,
  }) => {


    // 1. Write to AsyncStorage first
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
    }

    // 2. Update React states to trigger UI navigation & api calls safely
    setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);
    setUser(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        accessToken,
        refreshToken,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
}
