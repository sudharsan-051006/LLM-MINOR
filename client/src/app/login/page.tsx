"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const url = isRegister 
      ? 'http://127.0.0.1:8000/api/auth/register' 
      : 'http://127.0.0.1:8000/api/auth/login';
    
    const body = isRegister 
      ? { email, password, name, role } 
      : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      // FIX: pass data.id as 5th argument
      login(data.access_token, data.role, data.name, email, data.id);
      router.push('/');
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    const decoded: any = JSON.parse(atob(response.credential.split('.')[1]));
    
    try {
      const res = await fetch('http://localhost:8000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: decoded.email,
          name: decoded.name,
          google_id: decoded.sub
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      
      // FIX: pass data.id as 5th argument
      login(data.access_token, data.role, data.name, decoded.email, data.id);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Load Google Script
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        (window as any).google.accounts.id.initialize({
          client_id: "176069400560-gdtk5np8seq4hhp79nnlgifqf4vnlf4f.apps.googleusercontent.com",
          callback: handleGoogleSuccess,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", width: 260 } 
        );
      };
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 border border-gray-200 rounded-lg shadow-lg">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Intelligent Classroom</h1>
            <p className="text-gray-500">{isRegister ? "Create Account" : "Sign In"}</p>
        </div>

        {error && <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600">Name</label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Role</label>
                <select 
                  value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full border rounded-md p-2 mt-1 bg-white"
                >
                  <option value="student">Student</option>
                  <option value="professor">Professor</option>
                </select>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Password</label>
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition"
          >
            {isRegister ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <div className="flex justify-center">
            <div id="google-signin-btn"></div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          {isRegister ? "Already have an account?" : "Don't have an account?"} 
          <button onClick={() => setIsRegister(!isRegister)} className="text-blue-600 font-medium ml-1 hover:underline">
            {isRegister ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}