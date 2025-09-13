
'use client';

import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type { Student } from '@/services/students';
import { getStudentById } from '@/services/students';


interface UserContextType {
  student: Student | null;
  setStudent: (student: Student | null) => void;
  isLoading: boolean;
  refreshStudent: () => void;
}

export const UserContext = createContext<UserContextType>({
  student: null,
  setStudent: () => {},
  isLoading: true,
  refreshStudent: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [student, setStudentState] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudentData = useCallback(async () => {
     try {
        const storedId = typeof window !== 'undefined' ? sessionStorage.getItem('classemagique_student_id') : null;
        if (storedId) {
          const loggedInStudent = await getStudentById(storedId);
          setStudentState(loggedInStudent);
        } else {
          setStudentState(null);
        }
      } catch (error) {
        console.error("Could not access sessionStorage or fetch student", error);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('classemagique_student_id');
        }
        setStudentState(null);
      } finally {
        setIsLoading(false);
      }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchStudentData();
  }, [fetchStudentData]);

  const setStudent = (studentData: Student | null) => {
    try {
      if (studentData) {
        sessionStorage.setItem('classemagique_student_id', studentData.id);
        document.cookie = `classemagique_student_id=${studentData.id}; path=/; max-age=86400; SameSite=Strict`;
      } else {
        sessionStorage.removeItem('classemagique_student_id');
        document.cookie = 'classemagique_student_id=; path=/; max-age=-1; SameSite=Strict';
      }
    } catch (error) {
        console.error("Could not access sessionStorage", error);
    }
    setStudentState(studentData);
  };
  
  const refreshStudent = useCallback(() => {
      setIsLoading(true);
      fetchStudentData();
  }, [fetchStudentData]);

  const contextValue = useMemo(() => ({
    student,
    setStudent,
    isLoading,
    refreshStudent,
  }), [student, isLoading, refreshStudent]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
