
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


// const { user } = useAuth();
// console.log(user.name);
// login({
//   user: response.data.user,
//   accessToken: response.data.accessToken,
//   refreshToken: response.data.refreshToken
// });
// logout();
