//Navbar.tsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "/logo.png";
import "./Navbar.css";

const LoggedIn: React.FC = () => {
  
  return (
    <>
      
    
    </>
  );
};

const LoggedOut: React.FC = () => {
  
  return (
    <>
    
    </>
  );
};

const Navbar: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log("User is logged out");
    } else {
      console.log(`User ${user.username} has logged in`);
    }
  }, [user]);
  
  return (
    <nav className="nav">
      <Link id="logoContainter" to="/screens/auth/Welcome">
        <img id="logo" src="/logo.png"></img>
      </Link>
      {user ? <LoggedIn /> : <LoggedOut />}
    </nav>
  );
};

export default Navbar;
