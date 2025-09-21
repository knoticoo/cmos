import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    closeMobileMenu();
    logout();
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/players', label: 'Players', icon: '👥' },
    { path: '/events', label: 'Events', icon: '⚔️' },
    { path: '/alliances', label: 'Alliances', icon: '🏰' },
    ...(user?.isAdmin ? [{ path: '/admin', label: 'Admin', icon: '⚙️' }] : [])
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-brand">
          <Link to="/" onClick={closeMobileMenu}>
            Kings Choice MVP
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="navbar-nav">
          {navLinks.map(({ path, label, icon }) => (
            <Link 
              key={path}
              to={path} 
              className={`nav-link ${isActive(path) ? 'active' : ''}`}
              title={label}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          <div className="mobile-menu-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        {/* User Section */}
        <div className="navbar-user">
          <span className="user-info">
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                {user?.username || 'Guest'}
                {user?.isAdmin && <span className="admin-badge">Admin</span>}
              </>
            )}
          </span>
          <button 
            onClick={handleLogout} 
            className="btn btn-sm btn-secondary"
            disabled={loading}
            title="Sign out"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-nav">
          {navLinks.map(({ path, label, icon }, index) => (
            <Link 
              key={path}
              to={path} 
              className={`nav-link ${isActive(path) ? 'active' : ''}`}
              onClick={closeMobileMenu}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </Link>
          ))}
        </div>

        <div className="mobile-user-section">
          <div className="mobile-user-info">
            <span>👤</span>
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                {user?.username || 'Guest'}
                {user?.isAdmin && <span className="admin-badge">Admin</span>}
              </>
            )}
          </div>
          <button 
            onClick={handleLogout} 
            className="btn btn-primary"
            disabled={loading}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={closeMobileMenu}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        />
      )}
    </nav>
  );
};

export default Navigation;
