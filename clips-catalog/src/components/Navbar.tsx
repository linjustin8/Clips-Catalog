//Navbar.tsx

import React, { useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { DropdownMenu } from "./Dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import "/logo.png";
import "./Navbar.css";

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = location.pathname;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      console.log("User is logged out");
    } else {
      console.log(`User ${user.username} is logged in`);
    }
    const openPrint = open;
    console.log(openPrint);
  }, [user, open]);

  if (currentPage === "/login" || currentPage === "/signup") {
    // if current page is on login or signup
    return (
      <nav className="solo-logo">
        <button
          className="nav-button"
          onClick={() => {
            navigate("/Welcome");
          }}
        >
          <img id="logo" src="/logo_fill.png" />
        </button>
      </nav>
    );
  }

  return (
    <nav>
      <ul>
        <li id="logoContainer">
          <button
            className="nav-button"
            onClick={() => {
              navigate("/");
            }}
          >
            <img id="logo" src="/logo_fill.png" />
          </button>
        </li>
        <li className="nav-button-container">
          <button
            className="nav-button"
            onClick={() => {
              navigate("/videos");
            }}
          >
            Videos
          </button>
        </li>
        <li className="nav-button-container">
          <button
            className="nav-button"
            onClick={() => {
              navigate("/upload");
            }}
          >
            Upload
          </button>
        </li>
        <li
          className="nav-button-container github"
          onClick={() => {
            window.open(
              "https://github.com/linjustin8/Clips-Catalog",
              "_blank"
            );
          }}
        >
          <button className="nav-button github-button">
            <div id="github-text">GitHub</div>
            <FontAwesomeIcon icon={faGithub} id="github-logo" />
          </button>
        </li>
        {!user ? (
          <>
            <li className="nav-button-container sign-in">
              <button
                className="nav-button si-button"
                onClick={() => {
                  navigate("/login");
                }}
              >
                SIGN IN
              </button>
            </li>
            <li className="nav-button-container get-started">
              <button
                className="nav-button gs-button"
                onClick={() => {
                  navigate("/signup");
                }}
              >
                GET STARTED
              </button>
            </li>
          </>
        ) : (
          <button
            className="user-button"
            onClick={() => setOpen((open) => !open)}
          >
            {open ? (
              <FontAwesomeIcon icon={faUser} className="user-icon" />
            ) : (
              <>
                <FontAwesomeIcon icon={faCaretDown} className="user-icon" />
                <DropdownMenu />
              </>
            )}
          </button>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
