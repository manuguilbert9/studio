
'use client';

import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { Student } from '@/services/students';
import { getStudentById } from '@/services/students';


interface UserContextType {
  student: Student | null;
  setStudent: (student: Student | null) => void;
  isLoading: boolean;
}

export const UserContext = createContext<UserContextType>({
  student: null,
  setStudent: () => {},
  isLoading: true,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [student, setStudentState] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      try {
        const storedId = sessionStorage.getItem('classemagique_student_id');
        if (storedId) {
          const loggedInStudent = await getStudentById(storedId);
          setStudentState(loggedInStudent);
        }
      } catch (error) {
        console.error("Could not access sessionStorage or fetch student", error);
        // Clear broken session data
        sessionStorage.removeItem('classemagique_student_id');
        setStudentState(null);
      } finally {
        setIsLoading(false);
      }
    };
    initializeUser();
  }, []);

  const setStudent = (studentData: Student | null) => {
    try {
      if (studentData) {
        sessionStorage.setItem('classemagique_student_id', studentData.id);
      } else {
        sessionStorage.removeItem('classemagique_student_id');
      }
    } catch (error) {
        console.error("Could not access sessionStorage", error);
    }
    setStudentState(studentData);
  };
  
  // useMemo ensures the context value object is stable, preventing unnecessary re-renders
  // for consumers of the context.
  const contextValue = useMemo(() => ({
    student,
    setStudent,
    isLoading,
  }), [student, isLoading]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
