
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
  username: string | null;
  setUsername: (name: string | null) => void;
  isLoading: boolean;
}

export const UserContext = createContext<UserContextType>({
  username: null,
  setUsername: () => {},
  isLoading: true,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsernameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedName = sessionStorage.getItem('classemagique_username');
      if (storedName) {
        setUsernameState(storedName);
      }
    } catch (error) {
      console.error("Could not access sessionStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setUsername = (name: string | null) => {
    try {
      if (name) {
        sessionStorage.setItem('classemagique_username', name);
      } else {
        sessionStorage.removeItem('classemagique_username');
      }
      setUsernameState(name);
    } catch (error) {
        console.error("Could not access sessionStorage", error);
    }
  };

  return (
    <UserContext.Provider value={{ username, setUsername, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};
