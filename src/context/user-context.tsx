
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
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
      setStudentState(studentData);
    } catch (error) {
        console.error("Could not access sessionStorage", error);
    }
  };

  const contextValue = {
    // Provide a stable object to prevent unnecessary re-renders.
    // The username is now derived from the student object.
    student,
    username: student?.name || null,
    setStudent,
    isLoading,
  };
  
  // A temporary hack to expose username for components that haven't been migrated yet.
  // This avoids breaking the whole app at once.
  // @ts-ignore
  contextValue.setUsername = (name: string | null) => {
    if (name === null) {
      setStudent(null);
    } else {
      // This part is problematic as we don't have the full student object.
      // It's a temporary bridge.
      console.warn("setUsername is deprecated. Use setStudent instead.");
    }
  }


  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
