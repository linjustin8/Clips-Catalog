// Dropdown.tsx

import React, { useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import useAuth from "../hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
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

export const DropdownMenu: React.FC<MenuProps> = ({ open }) => {
  const [menuHeight, setMenuHeight] = useState(null);
  
  
  return (
    <div className="dropdown-menu">
      <CSSTransition
        in={open}
        unmountOnExit
        timeout={500}
        classNames="user-menu"
      >
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
      </CSSTransition>
    </div>
  );
};

/*
Dropdown Items:
- Account Settings
- My Clips
- Favorite Clips
- Log out
*/
