//Navbar.tsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import usePermissions from "../../hooks/usePermissions";
import { DropdownMenu } from "./Dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faUser } from "@fortawesome/free-solid-svg-icons";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import "/logo.png";
import "./Navbar.css";

const UploadModal = React.lazy(() => import("../upload/UploadModal"));

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = location.pathname;
  const [open, setOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

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
    <>
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
        <NavItem
          label="Videos"
          onClick={() => {
            navigate("/videos");
          }}
        />
        <NavItem
          label="About"
          onClick={() => {
            navigate("/about");
          }}
        />
        {isAdmin && (
          <li className="admin-upload-container">
            <button
              type="button"
              className="admin-upload-button"
              onClick={() => setUploadModalOpen(true)}
              aria-label="Upload a clip"
              title="Upload a clip"
            >
              <FontAwesomeIcon icon={faPlus} className="admin-upload-icon" />
              <span className="admin-upload-label">Upload</span>
            </button>
          </li>
        )}
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
          <li className="user-menu-container">
            <button
              className="user-button"
              onClick={() => setOpen((open) => !open)}
              aria-label="Open account menu"
              aria-expanded={open}
            >
              <FontAwesomeIcon
                icon={open ? faCaretDown : faUser}
                className="user-icon"
              />
            </button>
            <DropdownMenu
              open={open}
              onUploadClick={() => {
                setOpen(false);
                setUploadModalOpen(true);
              }}
            />
          </li>
        )}
      </ul>
    </nav>
    <React.Suspense fallback={null}>
      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </React.Suspense>
    </>
  );
};

const NavItem: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => {
  return (
    <li className="nav-button-container">
      <button
        className="nav-button"
        onClick={onClick}>
        {label}
      </button>
    </li>
  );
};

export default Navbar;
