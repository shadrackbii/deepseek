"use client"
import { useUser } from "@clerk/nextjs";
import { createContext, useContext, useEffect, useState } from "react"

// Create context with default value
export const AppContext = createContext({
  user: null,
  isLoaded: false
});

// Custom hook with safety check
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}

// Context Provider component
export const AppContextProvider = ({ children }) => {
  const { isLoaded, user } = useUser();
  const [contextValue, setContextValue] = useState({
    user: null,
    isLoaded: false
  });

  // Update context only when loaded to prevent flashes
  useEffect(() => {
    if (isLoaded) {
      setContextValue({
        user,
        isLoaded
      });
    }
  }, [isLoaded, user]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}