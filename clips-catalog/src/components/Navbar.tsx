//Navbar.tsx

import React, { useState, useEffect, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import "/logo.png";
import "./Navbar.css";


const Navbar: React.FC = () => {
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
          <button className="nav-button" onClick={() => {navigate("/Welcome")}}>
            <img id="logo" src="/logo.png" />
          </button>
        </li>
        <li className="nav-button-container">
          <button className="nav-button" onClick={() => {navigate("/videos")}}>Videos</button>
        </li>
        <li className="nav-button-container">
          <button className="nav-button" onClick={() => {navigate("/upload")}}>Upload</button>
        </li>
        <li className="nav-button-container github" onClick={() => {window.open('https://github.com/linjustin8/Clips-Catalog', '_blank')}}>
          <button className="nav-button github-button">
            <div id="github-text">GitHub</div>
            <FontAwesomeIcon icon={faGithub} id="github-logo" />
          </button>
        </li>
        { !user ? (
          <>
          <li className="nav-button-container sign-in">
            <button className="nav-button si-button" onClick={() => {navigate("/login")}}>SIGN IN</button>
          </li>
          <li className="nav-button-container get-started">
            <button className="nav-button gs-button" onClick={() => {navigate("/signup")}}>GET STARTED</button>
          </li>
          </>
        ) : (
          <>
          </>
        )}
        
      </ul>
    </nav>
  );
};

const DropdownMenu: React.FC = () => {
  return <></>;
};

export default Navbar;
