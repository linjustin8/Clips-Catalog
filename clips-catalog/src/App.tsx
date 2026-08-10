// App.tsx
import React from "react";
import useAuth from "./hooks/useAuth";
import Welcome from "./screens/auth/Welcome";
import { Login, Signup } from "./screens/auth/Auth";
import Videos from "./screens/videos/Videos";
import Upload from "./screens/videos/Upload";
import User from "./screens/user/User";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";

const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const auth = Boolean(user);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/upload" element={<Upload />} />
        {/* making sure that users already logged in are unable to signup or login*/}
        <Route path="/signup" element={auth ? <Navigate to="/welcome" /> : <Signup />} /> 
        <Route path="/login" element={auth ? <Navigate to="/welcome" /> : <Login />} />
        <Route path="/user" element={auth ? <User /> : <Navigate to="/welcome" />} />
        <Route path="/user/*" element={auth ? <User /> : <Navigate to="/welcome" />} />
        <Route path="/*" element={<Welcome />} />
      </Routes>
    </>
  );
};
export default App;
