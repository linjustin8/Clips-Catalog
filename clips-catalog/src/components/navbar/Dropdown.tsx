// Dropdown.tsx

import React, { useRef, ReactNode } from "react";
import { Link } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import useAuth from "@/hooks/useAuth";
import usePermissions from "@/hooks/usePermissions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faUpload } from "@fortawesome/free-solid-svg-icons";
import { faClapperboard } from "@fortawesome/free-solid-svg-icons";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import "./Dropdown.css";

interface ItemProps {
  route: string;
  icon: ReactNode;
  children: ReactNode;
}

interface MenuProps {
  open: boolean;
  onUploadClick: () => void;
}

const DropdownItem: React.FC<ItemProps> = ({ route, icon, children }) => {
  const { logout } = useAuth();

  return (
    <Link
      to={route}
      onClick={route === "/logout" ? () => logout() : undefined}
      className="menu-item"
    >
      <span className="item-icon">{icon}</span>
      {children}
    </Link>
  );
};

export const DropdownMenu: React.FC<MenuProps> = ({ open, onUploadClick }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = usePermissions();

  return (
    <CSSTransition
      nodeRef={menuRef}
      timeout={300}
      in={open}
      unmountOnExit
      classNames="dropdown"
    >
      <div className="dropdown-container" ref={menuRef}>
        <div className="dropdown-menu">
          {isAdmin && (
            <button
              type="button"
              className="menu-item menu-item-button"
              onClick={onUploadClick}
            >
              <span className="item-icon">
                <FontAwesomeIcon icon={faUpload} />
              </span>
              Upload
            </button>
          )}
          <DropdownItem
            route="/user/settings"
            icon={<FontAwesomeIcon icon={faGear} />}
          >
            Account Settings
          </DropdownItem>
          <DropdownItem
            route="/user/clips"
            icon={<FontAwesomeIcon icon={faClapperboard} />}
          >
            My Clips
          </DropdownItem>
          <DropdownItem
            route="/user/favorites"
            icon={<FontAwesomeIcon icon={faBookmark} />}
          >
            Favorites
          </DropdownItem>
          <DropdownItem
            route="/logout"
            icon={
              <FontAwesomeIcon
                icon={faRightFromBracket}
                className="logout-icon"
              />
            }
          >
            Sign Out
          </DropdownItem>
        </div>
      </div>
    </CSSTransition>
  );
};

/*
Dropdown Items:
- Account Settings
- My Clips
- Favorite Clips
- Log out
*/
