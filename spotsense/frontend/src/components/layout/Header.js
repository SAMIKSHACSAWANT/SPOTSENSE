import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { LoginModal, SignupModal } from '../auth';
import SearchBar from '../common/SearchBar';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleGetStarted = () => {
    navigate('/my-bookings');
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white dark:bg-neutral-900 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="font-display font-bold text-xl text-yellow-500 dark:text-yellow-400">
                SpotSense
              </span>
            </Link>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-700"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Desktop nav and search */}
            <div className="hidden md:flex items-center space-x-4 flex-grow mx-8">
              <nav className="flex space-x-8">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `text-sm font-medium ${
                      isActive
                        ? 'text-yellow-500 dark:text-yellow-400'
                        : 'text-neutral-700 hover:text-yellow-500 dark:text-neutral-300 dark:hover:text-yellow-400'
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    `text-sm font-medium ${
                      isActive
                        ? 'text-yellow-500 dark:text-yellow-400'
                        : 'text-neutral-700 hover:text-yellow-500 dark:text-neutral-300 dark:hover:text-yellow-400'
                    }`
                  }
                >
                  About
                </NavLink>
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    `text-sm font-medium ${
                      isActive
                        ? 'text-yellow-500 dark:text-yellow-400'
                        : 'text-neutral-700 hover:text-yellow-500 dark:text-neutral-300 dark:hover:text-yellow-400'
                    }`
                  }
                >
                  Contact
                </NavLink>
              </nav>
              
              {/* Search bar */}
              <div className="flex-grow mx-4">
                <SearchBar />
              </div>
            </div>

            {/* User section */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated() ? (
                <div className="relative">
                  <button
                    className="flex items-center space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-yellow-500 dark:hover:text-yellow-400"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <UserIcon className="h-5 w-5" />
                    <span>{user?.username || 'Account'}</span>
                  </button>
                  
                  {/* User dropdown menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg dark:bg-neutral-800 z-10">
                      <Link
                        to="/my-bookings"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        My Bookings
                      </Link>
                      <button
                        className="w-full text-left block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-yellow-500 dark:hover:text-yellow-400"
                    onClick={() => setIsLoginModalOpen(true)}
                  >
                    Log In
                  </button>
                  <button 
                    className="btn btn-primary bg-yellow-400 hover:bg-yellow-500 text-black"
                    onClick={() => setIsSignupModalOpen(true)}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 shadow-lg bg-white dark:bg-neutral-900">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'text-yellow-500 bg-yellow-50 dark:text-yellow-400 dark:bg-neutral-800'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-yellow-500 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-yellow-400'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'text-yellow-500 bg-yellow-50 dark:text-yellow-400 dark:bg-neutral-800'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-yellow-500 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-yellow-400'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'text-yellow-500 bg-yellow-50 dark:text-yellow-400 dark:bg-neutral-800'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-yellow-500 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-yellow-400'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </NavLink>
            
            {/* Mobile search */}
            <div className="px-3 py-2">
              <SearchBar />
            </div>
            
            {/* Mobile user section */}
            {isAuthenticated() ? (
              <>
                <button 
                  className="w-full mt-3 btn btn-primary bg-yellow-400 hover:bg-yellow-500 text-black"
                  onClick={() => {
                    handleGetStarted();
                    setIsMenuOpen(false);
                  }}
                >
                  My Bookings
                </button>
                <button 
                  className="w-full mt-3 btn btn-outline border-red-500 text-red-500"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  className="w-full mt-3 btn btn-outline"
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  Log In
                </button>
                <button 
                  className="w-full mt-3 btn btn-primary bg-yellow-400 hover:bg-yellow-500 text-black"
                  onClick={() => {
                    setIsSignupModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Authentication Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onSignupClick={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />
      
      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)}
        onLoginClick={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </>
  );
};

export default Header;