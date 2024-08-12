// App.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext.tsx";
import Welcome from "./screens/auth/Welcome.tsx";
import { Login } from "./screens/auth/Auth.tsx";
import { Signup } from "./screens/auth/Auth.tsx";
import Videos from "./screens/videos/Videos.tsx";
import Upload from "./screens/videos/Upload.tsx";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";

const App: React.FC = () => {
  const { user } = useAuth();
  const [auth, setAuth] = useState(false);

  useEffect(() => { // setting initial condition for if user is logged in
    setAuth(!!user);
  }, [user]);

  
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/*" element={<Welcome />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/upload" element={<Upload />} />
        {/* making sure that users already logged in are unable to signup or login*/}
        <Route path="/signup" element={auth ? <Navigate to="/welcome" /> : <Signup />} /> 
        <Route path="/login" element={auth ? <Navigate to="/welcome" /> : <Login />} />
      </Routes>
    </>
  );
};
export default App;
