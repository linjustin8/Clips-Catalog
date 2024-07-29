// App.tsx
import React from "react";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import Welcome from "./screens/auth/Welcome.tsx";
import Videos from "./screens/videos/Videos.tsx";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";
import "./App.css";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/videos" element={<Videos />} />
        <Route path="/*" element={<Welcome />} />
      </Routes>
    </AuthProvider>
  );
};
export default App;
