// src/context/AuthContext.tsx
import { socket } from "@/src/socket/socket";
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

export type AuthUser = {
  _id: string;
  fullName?: string;
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

  // 🔁 Restore session
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(USER_KEY);
        const savedAccess = await AsyncStorage.getItem(ACCESS_KEY);
        const savedRefresh = await AsyncStorage.getItem(REFRESH_KEY);

        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedAccess) setAccessToken(savedAccess);
        if (savedRefresh) setRefreshToken(savedRefresh);
      } catch (err) {
        console.error('Auth restore failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);



  useEffect(() => {
    if (!accessToken || !user?._id) return;

    // Add error listener before connecting
    socket.on("connect_error", (err) => {
      //console.error("❌ Socket Connection Error:", err.message);
    });

    socket.connect();

    const onConnect = () => {
      console.log("✅ USER socket connected:", socket.id);

      socket.emit("register-user", {
        userId: user._id,
      });

      console.log("📨 register-user emitted");
    };

    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [accessToken, user?._id]);


  // useEffect(() => {
  //   socket.on("connect", () => {
  //     console.log("✅ Socket connected:", socket.id);
  //   });

  //   socket.on("disconnect", () => {
  //     console.log("❌ Socket disconnected");
  //   });

  //   return () => {
  //     socket.off("connect");
  //     socket.off("disconnect");
  //   };
  // }, []);



  // 🔐 Login
  const login: AuthContextType['login'] = async ({
    user,
    accessToken,
    refreshToken,
  }) => {
    setUser(user);
    setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);
    console.log("user coordinates:", user);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(ACCESS_KEY, accessToken);

    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
    }
  };

  // 🚪 Logout
  const logout = async () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);

    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(ACCESS_KEY);
    await AsyncStorage.removeItem(REFRESH_KEY);
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
