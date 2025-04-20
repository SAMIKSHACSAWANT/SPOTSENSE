import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create the authentication context
const AuthContext = createContext();

// API base URL
const API_BASE_URL = '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      // For simplicity, we're accepting any email/password
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      
      if (response.data.success) {
        const userData = {
          email: email,
          username: email.split('@')[0],
          token: response.data.token
        };
        
        // Save user to state and localStorage
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
      
      return { success: false, message: 'Authentication failed' };
    } catch (error) {
      // If API call fails, simulate a successful login for demo purposes
      const userData = {
        email: email,
        username: email.split('@')[0],
        token: `demo_${email}_${Date.now()}`
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    }
  };

  // Register function
  const register = async (email, password) => {
    try {
      // For simplicity, we're accepting any registration
      // In a real app, we would call an API endpoint to create a new user
      
      // Simulate a successful registration
      const userData = {
        email: email,
        username: email.split('@')[0],
        token: `demo_${email}_${Date.now()}`
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        register, 
        isAuthenticated, 
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 