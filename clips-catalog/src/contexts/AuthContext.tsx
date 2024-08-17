// AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

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

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  signup: (params: SignupParams) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await axios.get("http://localhost:5000/user/me");
        setUser(response.data.user);
      } catch (err) {
        console.log("User is not authenticated", err);
      }
    };

    verifyAuth();
  }, []);

  const signup = async ({ username, email, password }: SignupParams) => {
    const response = await axios.post(
      "http://localhost:5000/user/signup",
      {
        username,
        email,
        password,
      },
      { withCredentials: true }
    );
    const userData: User = response.data.user;
    setUser(userData);
    setAccessToken(response.data.accessToken);
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post("http://localhost:5000/user/login", {
      email,
      password,
    });
    const userData: User = { ...response.data.UserInfo, email };
    setUser(userData);
    setAccessToken(response.data.accessToken);
    console.log(userData);
  };

  const logout = async () => {
    await axios.post("http://localhost:5000/user/logout");
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
