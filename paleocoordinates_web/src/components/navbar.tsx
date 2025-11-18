import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { pathname } = useLocation();

  const isActive = (path: string): boolean => pathname === path;


  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <img src={logo} alt="Logo" className="navbar-logo" />
          <span className="navbar-title">
            <span className="paleo">Paleo</span><span className="coordinates">coordinates</span>
          </span>
        </div>

        <nav className="navbar-menu">
          <Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link>
          <a href="/rotate" target="_self" rel="noopener noreferrer">Rotate</a>
          <Link to="/citation" className={isActive('/citation') ? 'active' : ''}>Citation</Link>
          <Link to="/about" className={isActive('/about') ? 'active' : ''}>About</Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
