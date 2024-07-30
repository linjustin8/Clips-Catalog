//Navbar.tsx

import React, { useState, useEffect, ReactNode, use } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-regular-svg-icons/faUser";
import "/logo.png";
import "./Navbar.css";

interface NavbarProps {
  children: ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      console.log("User is logged out");
    } else {
      console.log(`User ${user.username} has logged in`);
    }
  }, [user]);

  return (
    <nav className="nav">
      <ul>
        <li id="logoContainer">
          <Link to="/screens/auth/Welcome">
            <img id="logo" src="/logo.png" />
          </Link>
        </li>
        <li className="nav-buttons">
          <button id="videos-button" onClick={() => {navigate("/videos")}}>VIDEOS</button>
        </li>
        
      </ul>
      {children}
    </nav>
  );
};

const DropdownMenu: React.FC = () => {
  return <></>;
};

export default Navbar;
