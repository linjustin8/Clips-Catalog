// AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

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
  signup: (params: SignupParams) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

type CustomJwtPayload = {
  UserInfo: User;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [accessToken, setAccessToken] = useState(() => {
    const token = localStorage.getItem("accessToken");
    return token;
  });

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/user/refresh",
          {
            withCredentials: true,
          }
        );
        const token = response.data.accessToken;
        setAccessToken(token);
      } catch (err) {
        logout();
        console.log("User is not authenticated", err);
      }
    };

    verifyAuth();
  }, []);

  const signup = async ({ username, email, password }: SignupParams) => {
    const response = await axios.post(
      "http://localhost:5000/api/user/signup",
      {
        username,
        email,
        password,
      },
      {
        withCredentials: true,
      }
    );
    const token = response.data.accessToken;
    const decoded = jwtDecode<CustomJwtPayload>(token);
    const userData: User = decoded.UserInfo;

    setUser(userData);
    setAccessToken(response.data.accessToken);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", token);
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(
      "http://localhost:5000/api/user/login",
      {
        email,
        password,
      },
      {
        withCredentials: true,
      }
    );
    const token = response.data.accessToken;
    const decoded = jwtDecode<CustomJwtPayload>(token);
    const userData: User = decoded.UserInfo;

    setUser(userData);
    setAccessToken(token);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", token);
  };

  const logout = async () => {
    await axios.post("http://localhost:5000/api/user/logout", {
      withCredentials: true,
    });
    setUser(null);
    setAccessToken("");
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
