// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';

// Types
export type AuthUser = {
  id: string;
  name?: string;
  phone: string;
  avatar?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;

  setUser: (user: AuthUser | null) => void;
  login: (params: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Storage Keys
const ACCESS_KEY = 'gg_access_token';
const REFRESH_KEY = 'gg_refresh_token';
const USER_KEY = 'gg_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted session
  useEffect(() => {
    (async () => {
      try {
        const savedUser = await SecureStore.getItemAsync(USER_KEY);
        const savedAccess = await SecureStore.getItemAsync(ACCESS_KEY);
        const savedRefresh = await SecureStore.getItemAsync(REFRESH_KEY);

        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedAccess) setAccessToken(savedAccess);
        if (savedRefresh) setRefreshToken(savedRefresh);
      } catch (e) {
        console.error('Error restoring session:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Login (store user + tokens)
  const login: AuthContextType['login'] = async ({
    user,
    accessToken,
    refreshToken,
  }) => {
    try {
      setUser(user);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    } catch (err) {
      console.error('Error during login:', err);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);

      await SecureStore.deleteItemAsync(USER_KEY);
      await SecureStore.deleteItemAsync(ACCESS_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isLoading,
        setUser,
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
  if (!ctx)
    throw new Error('useAuthContext must be used inside <AuthProvider />');
  return ctx;
}
