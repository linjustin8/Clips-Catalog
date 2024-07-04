// AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import axios from "axios";

interface User {
  username: string;
  email: string;
  uuid: string;
  password: string;
  roles: Array<string>;
}

interface SignupParams {
  username: string;
  email: string;
  password: string;
  roles: Array<string>;
}

interface AuthContextType {
  user: User | null;
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Optionally verify token with backend and set user state
    }
  }, []);

  const signup = async ({ username, email, password, roles }: SignupParams) => {
    const response = await axios.post("http://localhost:5000/users/signup", {
      username,
      email,
      password,
      roles,
    });
    const token = response.data.token;
    localStorage.setItem("token", token);
    const userData: User = response.data.user; // Assuming the backend returns user data
    setUser(userData);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const login = async (username: string, password: string) => {
    const response = await axios.post("http://localhost:5000/users/login", {
      username,
      password,
    });
    const token = response.data.token;
    localStorage.setItem("token", token);
    const userData: User = response.data.user;
    setUser(userData);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
