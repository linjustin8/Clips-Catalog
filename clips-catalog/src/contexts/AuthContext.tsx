// AuthContext.tsx
import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_URL = "/api/user";

interface User {
  id: string;
  username: string;
  email: string;
  roles: Array<string>;
}

interface SignupParams {
  username: string;
  email: string;
  password: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  signup: (params: SignupParams) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

type CustomJwtPayload = {
  UserInfo: User;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((token: string) => {
    const decoded = jwtDecode<CustomJwtPayload>(token);

    setUser(decoded.UserInfo);
    setAccessToken(token);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await axios.get(`${API_URL}/refresh`, {
          withCredentials: true,
        });

        setSession(response.data.accessToken);
      } catch (err) {
        setUser(null);
        setAccessToken(null);
        console.log("User is not authenticated", err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [setSession]);

  const signup = async ({ username, email, password }: SignupParams) => {
    const response = await axios.post(
      `${API_URL}/signup`,
      {
        username,
        email,
        password,
      },
      {
        withCredentials: true,
      }
    );
    setSession(response.data.accessToken);
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(
      `${API_URL}/login`,
      {
        email,
        password,
      },
      {
        withCredentials: true,
      }
    );
    setSession(response.data.accessToken);
  };

  const logout = async () => {
    await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });

    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, signup, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
