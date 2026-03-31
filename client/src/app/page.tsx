"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type Course = {
  id: number;
  title: string;
  description: string | null;
  professor_id: number;
  class_code: string; // Add class_code to type
};

const cardColors = [
  "bg-blue-600", "bg-green-700", "bg-yellow-600", "bg-red-600", 
  "bg-purple-600", "bg-pink-600", "bg-indigo-600"
];

export default function Dashboard() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  
  // State for Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  
  const [isOpen, setIsOpen] = useState(false);

  // State for Join Modal
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // Fetch Logic...
  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/login');
      else fetchCourses();
    }
  }, [user, isLoading]);

  // ... existing imports and setup ...

  const fetchCourses = async () => {
    // Safety check: ensure user is loaded
    if (!user) return;

    try {
      const res = await fetch("http://localhost:8000/api/courses/", {
        headers: {
          // ADD THIS HEADER: Send the token so backend knows who you are
          "Authorization": `Bearer ${user.token}`
        }
      });
      
      if (res.status === 401) {
        // If unauthorized, force logout
        logout();
        router.push('/login');
        return;
      }

      const data = await res.json();
      setCourses(data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

// ... existing code ...

  // 1. Handle Create Course (Professor)
  const handleCreateCourse = async () => {
    if (!newTitle) return;
    try {
      const res = await fetch("http://localhost:8000/api/courses/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}` // UNCOMMENT THIS LINE
        },
        body: JSON.stringify({ title: newTitle, description: newDesc }),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewTitle(""); setNewDesc("");
        fetchCourses();
      } else { alert("Failed to create course"); }
    } catch (error) { console.error(error); }
  };

  // 2. Handle Join Course (Student)
  // ... existing imports and code ...

  // 2. Handle Join Course (Student)
  const handleJoinCourse = async () => {
    if (!joinCode || !user) return;
    try {
      const res = await fetch("http://localhost:8000/api/courses/join", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}` // Ensure this is here
        },
        body: JSON.stringify({ class_code: joinCode }),
      });
      // ... rest of logic
      const data = await res.json();
      if (res.ok) {
        setIsJoinModalOpen(false);
        setJoinCode("");
        fetchCourses(); // Refresh list
      } else {
        alert(data.detail || "Failed to join");
      }
    } catch (error) { console.error(error); }
  };

// ... rest of the code ...

  const handleLogout = () => { logout(); router.push('/login'); };

  if (isLoading || !user) return <div className="min-h-screen bg-g-grey flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-g-grey">
      {/* Top Nav (Same as before) */}
      <header className="bg-white border-b border-g-border sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-xl font-medium text-gray-700">Intelligent Classroom</h1>
          </div>
          
          <div className="flex items-center gap-4">
             {user.role === 'professor' && (
               <Link href="/grading" className="text-sm text-blue-600 hover:underline hidden md:block">
                 Professor Grading View
               </Link>
             )}
             <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
                <div className="relative">
              <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold cursor-pointer"
              >
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg py-2 z-20 border">
                  <div className="px-4 py-2 text-xs text-gray-500 border-b">
                    Signed in as <span className="font-bold text-gray-700">{user.email}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                  Logout
                  </button>
                </div>
              )}
            </div>
             </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course, index) => (
            <Link key={course.id} href={`/course/${course.id}`}>
              <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden border border-g-border group h-full">
                <div className={`h-24 ${cardColors[index % cardColors.length]} relative p-4`}>
                  <h2 className="text-xl font-medium text-white">{course.title}</h2>
                </div>
                <div className="p-4 border-t border-gray-100">
                  <p className="text-gray-700 text-sm font-bold">Prof. ID: {course.professor_id}</p>
                  <p className="text-gray-500 text-sm mt-1">{course.description || "No description"}</p>
                  
                  {/* Show Class Code for Professors */}
                  {user.role === 'professor' && (
                     <div className="mt-2 text-xs text-gray-400">
                       Code: <span className="font-mono font-bold text-blue-600">{course.class_code}</span>
                     </div>
                  )}

                  <span className="mt-2 inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                    AI ACTIVE
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* FAB Button Logic */}
        {user.role === 'professor' ? (
            // Professor Button: Create
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-xl flex items-center justify-center"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
        ) : (
            // Student Button: Join
            <button 
              onClick={() => setIsJoinModalOpen(true)}
              className="fixed bottom-8 right-8 bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 shadow-xl flex items-center justify-center"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
        )}
      </main>

      {/* Create Course Modal (Professor) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Create New Course</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Course Title</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Cancel</button>
              <button onClick={handleCreateCourse} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Join Class Modal (Student) */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Join a Class</h2>
            <p className="text-sm text-gray-500 mb-4">Ask your teacher for the class code, then enter it here.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Code</label>
              <input 
                type="text" 
                value={joinCode} 
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())} 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono tracking-widest text-center"
                placeholder="ABC1234"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsJoinModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Cancel</button>
              <button onClick={handleJoinCourse} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Join</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}