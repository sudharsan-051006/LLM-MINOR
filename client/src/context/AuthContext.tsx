"use client";
import React, { createContext, useState, useEffect, useContext } from 'react';

type User = {
  id: number;       // ← ADDED
  email: string;
  name: string;
  role: string;
  token: string;
};

type AuthContextType = {
  user: User | null;
  login: (token: string, role: string, name: string, email: string, id: number) => void; // ← ADDED id param
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const id = localStorage.getItem('id');   // ← ADDED

    if (token && role && id) {
      setUser({ token, role, name: name || '', email: email || '', id: Number(id) }); // ← ADDED id
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, role: string, name: string, email: string, id: number) => { // ← ADDED id param
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name);
    localStorage.setItem('email', email);
    localStorage.setItem('id', String(id));  // ← ADDED
    setUser({ token, role, name, email, id }); // ← ADDED id
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};