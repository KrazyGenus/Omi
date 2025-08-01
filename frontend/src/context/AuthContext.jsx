// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext(null);

// IMPORTANT: Ensure this key matches exactly what you use in localStorage.setItem in LoginPage!
export const AUTH_TOKEN_LOCAL_STORAGE_KEY = 'token'; // Based on your code: localStorage.setItem("token", token);
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // This useEffect runs only once on mount of AuthProvider
  useEffect(() => {
    console.log("AuthContext: useEffect triggered (initial load/mount)");
    const token = localStorage.getItem(AUTH_TOKEN_LOCAL_STORAGE_KEY);
    if (token) {
      // You might add token validation here (e.g., decode JWT to check expiry)
      // For now, assuming existence implies authentication
      setIsAuthenticated(true);
      console.log("AuthContext: Token found in localStorage. Setting isAuthenticated to TRUE.");
    } else {
      console.log("AuthContext: No token found in localStorage.");
    }
    setIsLoading(false); // Finished initial check
    console.log("AuthContext: isLoading set to FALSE.");
  }, []);

  // This effect runs every time isAuthenticated or isLoading changes
  // Useful for seeing state transitions
  useEffect(() => {
    console.log(`AuthContext: State Updated! isAuthenticated: ${isAuthenticated}, isLoading: ${isLoading}`);
  }, [isAuthenticated, isLoading]);


  const login = (token, userId) => {
    console.log("AuthContext: login function called with token:", token ? "received" : "null/undefined");
    localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, token); // Store the token
    localStorage.setItem("USERID", userId);
    setIsAuthenticated(true); // <--- THIS IS THE CRUCIAL LINE
    console.log("AuthContext: isAuthenticated set to TRUE inside login function.");
  };

  const logout = () => {
    console.log("AuthContext: logout function called.");
    localStorage.removeItem(AUTH_TOKEN_LOCAL_STORAGE_KEY); // Remove token
    localStorage.removeItem("USERID");
    setIsAuthenticated(false); // Update state to false
    console.log("AuthContext: isAuthenticated set to FALSE inside logout function.");
  };

  // Render a loading state while authentication status is being determined
  if (isLoading) {
    console.log("AuthContext: Currently rendering LOADING state.");
    return <div>Loading authentication status...</div>;
  }

  // After loading, provide the context value
  console.log(`AuthContext: Provider rendering with isAuthenticated: ${isAuthenticated}`);
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
