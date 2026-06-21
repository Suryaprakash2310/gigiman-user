
import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  const {
    user,
    accessToken,
    refreshToken,
    isLoading,
    setUser,
    login,
    logout,
  } = useAuthContext();

  return {
    user,
    accessToken,
    refreshToken,
    isLoading,
    setUser,
    login,
    logout,
  };
}


