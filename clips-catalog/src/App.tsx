// App.tsx
import React, { useState, useEffect } from "react";
import useAuth from "./hooks/useAuth";
import Welcome from "./screens/auth/Welcome";
import { Login } from "./screens/auth/Auth";
import { Signup } from "./screens/auth/Auth";
import Videos from "./screens/videos/Videos";
import Upload from "./screens/videos/Upload";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

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
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/upload" element={<Upload />} />
        {/* making sure that users already logged in are unable to signup or login*/}
        <Route path="/signup" element={auth ? <Navigate to="/welcome" /> : <Signup />} /> 
        <Route path="/login" element={auth ? <Navigate to="/welcome" /> : <Login />} />
        <Route path="/*" element={<Welcome />} />
      </Routes>
    </>
  );
};
export default App;
