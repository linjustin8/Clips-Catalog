//Navbar.tsx

import React from 'react';
import { Link } from 'react-router-dom'
import '/logo.png'
import './Navbar.css'


const Navbar: React.FC = () => {
    return (
        <nav className="nav">
            <Link to="/screens/auth/Welcome">
                <img id="logo" src="/logo.png"></img>
            </Link>
        </nav>
    )
}

export default Navbar