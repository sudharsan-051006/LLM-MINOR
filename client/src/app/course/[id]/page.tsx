"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AssignmentPanel from "@/components/ui/AssignmentPanel";

// --- Types ---
type Comment = {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
  user_id: number;
};

type Post = {
  id: number;
  content: string | null;
  post_type: 'text' | 'file' | 'assignment';
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  author_name: string;
  user_id: number;
  comments: Comment[];
};

type CourseData = {
  id: number;
  title: string;
  description: string;
  professor_name: string;
  class_code?: string;
};

type OtherCourse = {
  id: number;
  title: string;
  professor_name: string;
  class_code?: string;
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --primary: #1a73e8;
    --primary-dark: #1557b0;
    --primary-light: #e8f0fe;
    --surface: #ffffff;
    --surface-2: #f8f9fa;
    --surface-3: #f1f3f4;
    --border: #dadce0;
    --text-primary: #202124;
    --text-secondary: #5f6368;
    --text-tertiary: #80868b;
    --green: #188038;
    --green-light: #e6f4ea;
    --orange: #e37400;
    --orange-light: #fef0cd;
    --purple: #7c4dff;
    --purple-light: #ede7f6;
    --red: #d93025;
    --shadow-1: 0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
    --shadow-2: 0 1px 3px rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15);
    --radius: 8px;
    --radius-lg: 16px;
    --font-sans: 'Google Sans', 'Roboto', sans-serif;
  }

  .cs-root {
    font-family: var(--font-sans);
    background: var(--surface-2);
    min-height: 100vh;
    color: var(--text-primary);
  }

  /* === HERO === */
  .cs-hero {
    position: relative; height: 220px; overflow: hidden;
    display: flex; align-items: flex-end; padding: 24px 32px;
  }
  .cs-hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
  .cs-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%);
  }
  .cs-hero-content { position: relative; z-index: 2; color: white; }
  .cs-hero-title { font-size: 32px; font-weight: 700; line-height: 1.1; letter-spacing: -0.5px; text-shadow: 0 1px 4px rgba(0,0,0,0.3); }
  .cs-hero-sub { font-size: 15px; margin-top: 6px; opacity: 0.92; font-weight: 400; }
  .cs-hero-code {
    display: inline-flex; align-items: center; gap: 6px; margin-top: 10px;
    background: rgba(255,255,255,0.18); backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.3); border-radius: 20px;
    padding: 4px 14px; font-size: 13px; font-weight: 500;
  }

  /* === OUTER LAYOUT === */
  .cs-outer { display: flex; align-items: flex-start; }

  /* === LEFT NAV === */
  .cs-left-nav {
    width: 256px; flex-shrink: 0;
    padding: 20px 8px 20px 12px;
    position: sticky; top: 0; height: 100vh;
    overflow-y: auto; background: var(--surface);
    border-right: 1px solid var(--border);
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }
  .cs-left-nav::-webkit-scrollbar { width: 4px; }
  .cs-left-nav::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .cs-left-nav-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
    text-transform: uppercase; color: var(--text-tertiary);
    padding: 0 10px; margin-bottom: 8px; margin-top: 4px;
  }

  .cs-course-pill {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 10px; cursor: pointer;
    text-decoration: none; transition: background 0.15s ease;
    margin-bottom: 2px; border: none; background: none;
    width: 100%; text-align: left; font-family: var(--font-sans);
  }
  .cs-course-pill:hover { background: var(--surface-3); }
  .cs-course-pill.active { background: var(--primary-light); cursor: default; }

  .cs-course-pill-icon {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
  }
  .cs-course-pill-info { flex: 1; min-width: 0; }
  .cs-course-pill-name {
    font-size: 13px; font-weight: 600; color: var(--text-primary);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cs-course-pill.active .cs-course-pill-name { color: var(--primary); }
  .cs-course-pill-prof {
    font-size: 11px; color: var(--text-tertiary); margin-top: 1px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cs-active-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--primary); flex-shrink: 0; }

  .cs-nav-divider { height: 1px; background: var(--border); margin: 12px 10px; }
  .cs-nav-empty { padding: 8px 10px; font-size: 12px; color: var(--text-tertiary); }

  /* === MAIN === */
  .cs-main { flex: 1; min-width: 0; padding: 24px 20px; }

  /* === INNER BODY: stream + right chat === */
  .cs-body { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }

  /* === COMPOSER === */
  .cs-composer {
    background: var(--surface); border-radius: var(--radius-lg);
    border: 1px solid var(--border); box-shadow: var(--shadow-1);
    padding: 16px 20px; margin-bottom: 16px; transition: box-shadow 0.2s;
  }
  .cs-composer:focus-within { box-shadow: var(--shadow-2); border-color: var(--primary); }
  .cs-composer-tabs { display: flex; gap: 4px; margin-bottom: 14px; }
  .cs-tab {
    padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 500;
    border: none; cursor: pointer; background: transparent; color: var(--text-secondary);
    transition: all 0.15s ease; font-family: var(--font-sans);
  }
  .cs-tab:hover { background: var(--surface-3); color: var(--text-primary); }
  .cs-tab.active { background: var(--primary-light); color: var(--primary); }
  .cs-composer-row { display: flex; gap: 12px; align-items: flex-start; }
  .cs-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px; flex-shrink: 0; font-family: var(--font-sans);
  }
  .cs-composer-input {
    flex: 1; background: var(--surface-3); border: 1.5px solid transparent;
    border-radius: 24px; padding: 10px 18px; font-size: 14px;
    font-family: var(--font-sans); color: var(--text-primary);
    resize: none; outline: none; line-height: 1.5; transition: all 0.2s;
  }
  .cs-composer-input:focus { background: var(--surface); border-color: var(--primary); box-shadow: 0 0 0 3px rgba(26,115,232,0.12); }
  .cs-composer-input::placeholder { color: var(--text-tertiary); }
  .cs-composer-actions { display: flex; gap: 8px; align-items: center; margin-top: 12px; padding-left: 48px; }
  .cs-btn {
    padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600;
    border: none; cursor: pointer; font-family: var(--font-sans); transition: all 0.15s ease;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .cs-btn-primary { background: var(--primary); color: white; }
  .cs-btn-primary:hover { background: var(--primary-dark); box-shadow: var(--shadow-1); }
  .cs-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .cs-btn-ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); }
  .cs-btn-ghost:hover { background: var(--surface-3); color: var(--text-primary); }

  /* === POST === */
  .cs-post {
    background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border);
    box-shadow: var(--shadow-1); margin-bottom: 16px; overflow: hidden;
    animation: fadeSlideIn 0.3s ease;
  }
  @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .cs-post-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 20px 0; }
  .cs-post-meta { display: flex; gap: 12px; align-items: center; flex: 1; }
  .cs-post-info { flex: 1; }
  .cs-post-author { font-size: 14px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .cs-post-time { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
  .cs-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; }
  .cs-badge-announcement { background: var(--primary-light); color: var(--primary); }
  .cs-badge-material { background: var(--orange-light); color: var(--orange); }
  .cs-badge-assignment { background: var(--purple-light); color: var(--purple); }
  .cs-post-body { padding: 12px 20px 0 68px; }
  .cs-post-text { font-size: 14px; line-height: 1.65; color: var(--text-primary); white-space: pre-wrap; }
  .cs-attachment {
    display: inline-flex; align-items: center; gap: 12px; margin-top: 12px; padding: 10px 16px;
    border: 1px solid var(--border); border-radius: var(--radius); text-decoration: none;
    background: var(--surface-2); transition: all 0.15s ease; max-width: 320px;
  }
  .cs-attachment:hover { background: var(--primary-light); border-color: var(--primary); box-shadow: var(--shadow-1); }
  .cs-attachment-icon { width: 36px; height: 36px; border-radius: 6px; background: #fce8e6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cs-attachment-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .cs-attachment-hint { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }

  /* === COMMENTS === */
  .cs-comments { margin-top: 12px; padding: 14px 20px 16px 68px; border-top: 1px solid var(--surface-3); background: var(--surface-2); }
  .cs-comments-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; letter-spacing: 0.5px; text-transform: uppercase; }
  .cs-comment { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; animation: fadeSlideIn 0.2s ease; }
  .cs-comment-bubble { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 8px 12px; }
  .cs-comment-top { display: flex; justify-content: space-between; align-items: center; }
  .cs-comment-author { font-size: 12px; font-weight: 600; color: var(--text-primary); }
  .cs-comment-time { font-size: 11px; color: var(--text-tertiary); }
  .cs-comment-text { font-size: 13px; color: var(--text-secondary); margin-top: 3px; line-height: 1.5; }
  .cs-comment-delete {
    background: none; border: none; cursor: pointer; color: var(--text-tertiary);
    padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0; margin-top: 2px;
  }
  .cs-comment-delete:hover { background: #fce8e6; color: var(--red); }
  .cs-comment-input-row { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
  .cs-comment-input {
    flex: 1; background: var(--surface); border: 1.5px solid var(--border); border-radius: 24px;
    padding: 8px 16px; font-size: 13px; font-family: var(--font-sans); outline: none;
    transition: all 0.2s; color: var(--text-primary);
  }
  .cs-comment-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(26,115,232,0.1); }
  .cs-comment-input::placeholder { color: var(--text-tertiary); }
  .cs-comment-post-btn {
    background: none; border: none; cursor: pointer; color: var(--primary);
    font-size: 13px; font-weight: 700; font-family: var(--font-sans);
    padding: 4px 8px; border-radius: 6px; transition: all 0.15s;
  }
  .cs-comment-post-btn:hover { background: var(--primary-light); }
  .cs-delete-post {
    background: none; border: none; cursor: pointer; color: var(--text-tertiary);
    padding: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0;
  }
  .cs-delete-post:hover { background: #fce8e6; color: var(--red); }

  /* === AI CHAT === */
  .cs-sidebar { display: flex; flex-direction: column; gap: 16px; }
  .cs-chat {
    background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border);
    box-shadow: var(--shadow-1); display: flex; flex-direction: column;
    height: 480px; position: sticky; top: 16px;
  }
  .cs-chat-header {
    padding: 14px 18px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
    background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  .cs-chat-ai-icon {
    width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: white;
    border: 1.5px solid rgba(255,255,255,0.4);
  }
  .cs-chat-title { font-size: 14px; font-weight: 700; color: white; }
  .cs-chat-sub { font-size: 11px; color: rgba(255,255,255,0.75); }
  .cs-chat-dot { width: 7px; height: 7px; border-radius: 50%; background: #34a853; margin-left: auto; box-shadow: 0 0 6px rgba(52,168,83,0.8); animation: pulse 2s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .cs-chat-messages {
    flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
    background: #fafbff; scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }
  .cs-chat-messages::-webkit-scrollbar { width: 4px; }
  .cs-chat-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  .cs-msg { display: flex; }
  .cs-msg.user { justify-content: flex-end; }
  .cs-msg.ai, .cs-msg.system { justify-content: flex-start; }
  .cs-bubble { max-width: 82%; padding: 9px 14px; border-radius: 18px; font-size: 13px; line-height: 1.55; }
  .cs-msg.user .cs-bubble { background: var(--primary); color: white; border-bottom-right-radius: 4px; box-shadow: 0 1px 3px rgba(26,115,232,0.4); }
  .cs-msg.ai .cs-bubble { background: white; color: var(--text-primary); border-bottom-left-radius: 4px; border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .cs-msg.system .cs-bubble { background: var(--orange-light); color: var(--orange); border: 1px solid rgba(227,116,0,0.2); font-size: 12px; font-style: italic; }
  .cs-chat-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; color: var(--text-tertiary); }
  .cs-chat-empty p { font-size: 13px; text-align: center; }
  .cs-chat-footer {
    padding: 12px 14px; border-top: 1px solid var(--border); display: flex; gap: 8px; align-items: center;
    background: var(--surface); border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }
  .cs-chat-input {
    flex: 1; background: var(--surface-3); border: 1.5px solid transparent; border-radius: 24px;
    padding: 9px 16px; font-size: 13px; font-family: var(--font-sans); outline: none;
    transition: all 0.2s; color: var(--text-primary);
  }
  .cs-chat-input:focus { background: white; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(26,115,232,0.1); }
  .cs-chat-input::placeholder { color: var(--text-tertiary); }
  .cs-send-btn {
    width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: white;
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0; box-shadow: var(--shadow-1);
  }
  .cs-send-btn:hover { background: var(--primary-dark); transform: scale(1.05); }

  /* === LOADING === */
  .cs-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 16px; background: var(--surface-2); font-family: var(--font-sans); }
  .cs-spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid var(--border); border-top-color: var(--primary); animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* === EMPTY STATE === */
  .cs-empty { padding: 60px 20px; text-align: center; color: var(--text-tertiary); }
  .cs-empty p { font-size: 14px; margin-top: 8px; }
  .cs-file-chip { display: inline-flex; align-items: center; gap: 6px; background: var(--primary-light); color: var(--primary); border-radius: 16px; padding: 4px 12px; font-size: 12px; font-weight: 500; }
  .cs-stream { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .cs-stream::-webkit-scrollbar { width: 4px; }
  .cs-stream::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;

const HERO_IMAGES = [
  "https://www.gstatic.com/classroom/themes/img_reachout.jpg",
  "https://www.gstatic.com/classroom/themes/img_breakfast.jpg",
  "https://www.gstatic.com/classroom/themes/img_code.jpg",
  "https://www.gstatic.com/classroom/themes/img_bookclub.jpg",
  "https://www.gstatic.com/classroom/themes/img_learnlanguage.jpg",
];

const AVATAR_COLORS = ["#1a73e8","#188038","#e37400","#d93025","#7c4dff","#0097a7","#c0392b","#2980b9"];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let c of name || "") hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return (name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div className="cs-avatar" style={{ width: size, height: size, fontSize: size > 30 ? 13 : 11, background: getAvatarColor(name), color: "white", flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}
function PostBadge({ type }: { type: string }) {
  if (type === "file") return <span className="cs-badge cs-badge-material">Material</span>;
  return <span className="cs-badge cs-badge-announcement">Announcement</span>;
}
function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}
function AttachIcon() {
  return (
    <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.585a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

export default function CourseStream() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id ? Number(params.id) : null;
  const { user } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otherCourses, setOtherCourses] = useState<OtherCourse[]>([]);

  const [postType, setPostType] = useState<'text' | 'file' | 'assignment'>('text');
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
  const [messages, setMessages] = useState<{ type: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [showAssignments, setShowAssignments] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const heroImage = HERO_IMAGES[(courseData?.id || 0) % HERO_IMAGES.length];

const fetchPosts = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const res = await fetch(`http://localhost:8000/api/posts/${courseId}`);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();

    // ✅ Normalize posts to prevent undefined errors
    const normalizedPosts = data.map((p: Post) => ({
      ...p,
      comments: Array.isArray(p.comments) ? p.comments : []
    }));

    setPosts(normalizedPosts);

  } catch (err: any) {
    setError(err.message || "Failed to load posts");
  } finally {
    setIsLoading(false);
  }
};

  const fetchCourseInfo = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/courses/${courseId}`);
      if (res.ok) setCourseData(await res.json());
    } catch (err) { console.error(err); }
  };

  // Fetch the user's other courses for the left sidebar
  const fetchUserCourses = async () => {
    if (!user) return;
    try {
      // Professor → courses they teach; Student → courses they're enrolled in
      const endpoint = user.role === "professor"
  ? `http://localhost:8000/api/courses/my`
  : `http://localhost:8000/api/courses/enrolled`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data: OtherCourse[] = await res.json();
        setOtherCourses(data.filter(c => c.id !== courseId)); // exclude current course
      }
    } catch (err) { console.error(err); }
  };

useEffect(() => {
  if (!courseId) return;
  fetchPosts();
  fetchCourseInfo();
}, [courseId]);
  useEffect(() => { if (user) fetchUserCourses(); }, [user, courseId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleCreatePost = async () => {
    if ((!newPostContent && !selectedFile) || !user) return;
    setIsPosting(true);
    const formData = new FormData();
    formData.append("course_id", courseId.toString());
    formData.append("user_id", user?.id?.toString() || "0");
    formData.append("post_type", postType);
    if (newPostContent) formData.append("content", newPostContent);
    if (selectedFile) formData.append("file", selectedFile);
    try {
const res = await fetch("http://localhost:8000/api/posts/", {
  method: "POST",
  headers: { Authorization: `Bearer ${user?.token}` },
  body: formData,
});

if (res.ok) {
  const newPost = await res.json();

  const safePost: Post = {
    id: newPost.id,
    content: newPost.content ?? newPostContent,
    post_type: newPost.post_type ?? postType,
    file_url: newPost.file_url ?? null,
    file_name: newPost.file_name ?? selectedFile?.name ?? null,
    created_at: newPost.created_at ?? new Date().toISOString(),

    // 🔥 FIX HERE
    author_name: newPost.author_name ?? user?.name ?? "You",
    user_id: newPost.user_id ?? user?.id ?? 0,

    comments: Array.isArray(newPost.comments) ? newPost.comments : []
  };

  setPosts(prev => [safePost, ...prev]);

  setNewPostContent("");
  setSelectedFile(null);
}
      else alert("Failed to post");
    } catch (err) { console.error(err); }
    finally { setIsPosting(false); }
  };

  const handleDeletePost = async (postId: number) => {
    if (!user || !confirm("Delete this post?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/posts/${postId}`, { method: "DELETE", headers: { Authorization: `Bearer ${user.token}` } });
      if (res.ok) {
  setPosts(prev => prev.filter(p => p.id !== postId));
}
    } catch (err) { console.error(err); }
  };

  const handleAddComment = async (postId: number) => {
    const content = commentInputs[postId];
    if (!content?.trim() || !user) return;
    const formData = new FormData();
    formData.append("content", content);
    formData.append("user_id", user?.id?.toString() || "1");
    try {
      const res = await fetch(`http://localhost:8000/api/posts/${postId}/comments`, {
        method: "POST", headers: { Authorization: `Bearer ${user?.token}` }, body: formData,
      });
if (res.ok) {
  const newComment = await res.json();

  setPosts(prev =>
    prev.map(post =>
      post.id === postId
        ? { ...post, comments: [...post.comments, newComment] }
        : post
    )
  );

  setCommentInputs(prev => ({ ...prev, [postId]: "" }));
}
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user || !confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/posts/comments/${commentId}`, { method: "DELETE", headers: { Authorization: `Bearer ${user.token}` } });
      if (res.ok) {
  setPosts(prev =>
    prev.map(post => ({
      ...post,
      comments: post.comments.filter(c => c.id !== commentId)
    }))
  );
}
    } catch (err) { console.error(err); }
  };

  const handleSend = async () => {
    if (!input || !user) return;
    setMessages(prev => [...prev, { type: "user", text: input }]);
    setInput("");
    try {
      const res = await fetch(`http://localhost:8000/api/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ query: input, course_id: courseId }),
      });
      const data = await res.json();
      if (data.status === "ESCALATED") {
        setMessages(prev => [...prev, { type: "system", text: "Your question has been forwarded to the professor." }]);
      } else {
        setMessages(prev => [...prev, { type: "ai", text: data.answer }]);
      }
    } catch {
      setMessages(prev => [...prev, { type: "system", text: "Could not connect to the assistant." }]);
    }
  };

  if (isLoading) return (
    <div className="cs-loading">
      <style>{styles}</style>
      <div className="cs-spinner" />
      <span style={{ color: "#5f6368", fontSize: 14, fontFamily: "Google Sans, sans-serif" }}>Loading classroom...</span>
    </div>
  );

  if (error) return (
    <div className="cs-loading">
      <style>{styles}</style>
      <p style={{ color: "#d93025", fontSize: 15 }}>⚠ {error}</p>
    </div>
  );

  return (
    <div className="cs-root">
      <style>{styles}</style>

      {/* HERO */}
      {courseData && (
        <div className="cs-hero">
          <div className="cs-hero-bg" style={{ backgroundImage: `url(${heroImage})` }} />
          <div className="cs-hero-overlay" />
          <div className="cs-hero-content">
            <h1 className="cs-hero-title">{courseData.title}</h1>
            <p className="cs-hero-sub">{courseData.professor_name}</p>
            {courseData.class_code && (
              <div className="cs-hero-code">
                <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Class code: {courseData.class_code}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OUTER: left nav + main */}
      <div className="cs-outer">

        {/* ── LEFT SIDEBAR ── */}

          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            style={{
              position: "fixed",
              top: 20,
              left: 20,
              zIndex: 2000,
              padding: "8px 14px",
              borderRadius: "10px",
              border: "1px solid #dadce0",
              background: "white",
              cursor: "pointer",
              fontWeight: 600,
              marginTop:'180px',
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              // position: "fixed",
            }}
          >
            {isSidebarOpen ? "☰" : "☰"}
          </button>
        <nav
          className="cs-left-nav"
          style={{
            width: isSidebarOpen ? 256 : 0,
            padding: isSidebarOpen ? "20px 8px 20px 12px" : "0",
            overflow: "hidden",
            transition: "all 0.3s ease"
          }}
        >

          {/* Current course */}
          {courseData && (
            <>
              <div className="cs-left-nav-label">Current Class</div>
              <div className="cs-course-pill active">
                <div className="cs-course-pill-icon" style={{ background: getAvatarColor(courseData.title) }}>
                  {getInitials(courseData.title)}
                </div>
                <div className="cs-course-pill-info">
                  <div className="cs-course-pill-name">{courseData.title}</div>
                  <div className="cs-course-pill-prof">{courseData.professor_name}</div>
                </div>
                <div className="cs-active-dot" />
              </div>
            </>
          )}

          {/* Other courses */}
          {otherCourses.length > 0 && (
            <>
              <div className="cs-nav-divider" />
              <div className="cs-left-nav-label">Other Classes</div>
              {otherCourses.map(course => (
                <button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    router.push(`/course/${course.id}`);
  }}
>
                  <div className="cs-course-pill-icon" style={{ background: getAvatarColor(course.title) }}>
                    {getInitials(course.title)}
                  </div>
                  <div className="cs-course-pill-info">
                    <div className="cs-course-pill-name">{course.title}</div>
                    <div className="cs-course-pill-prof">{course.professor_name}</div>
                  </div>
                </button>
              ))}
            </>
          )}

          {otherCourses.length === 0 && courseData && (
            <>
              <div className="cs-nav-divider" />
              <div className="cs-nav-empty">No other classes </div>
            </>
          )}
        </nav>

        {/* ── MAIN ── */}
        <div className="cs-main">

          {/* Assignment Panel */}
<div style={{
  marginBottom: "16px",
  borderRadius: "12px",
  border: "1px solid #dadce0",
  background: "white",
  overflow: "hidden"
}}>
  
  {/* Header */}
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    cursor: "pointer",
    background: "#f8f9fa",
    borderBottom: showAssignments ? "1px solid #dadce0" : "none"
  }}
  onClick={() => setShowAssignments(prev => !prev)}
  >
    <span style={{ fontWeight: 600 }}>Assignments</span>

    <span style={{
      fontSize: "14px",
      color: "#1a73e8",
      fontWeight: 500
    }}>
      {showAssignments ? "Hide ▲" : "Show ▼"}
    </span>
  </div>

  {/* Content */}
  {showAssignments && (
    <div style={{ padding: "12px" }}>
      <AssignmentPanel
        courseId={courseId}
        courseCode={courseData?.class_code || ""}
      />
    </div>
  )}

</div>

          {/* Stream + Chat */}
          <div className="cs-body">

            {/* LEFT: Stream */}
            <div className="cs-stream" style={{ minWidth: 0 }}>

              {/* Composer */}
              {user && (
                <div className="cs-composer">
                  {user?.role === "professor" && (
                    <div className="cs-composer-tabs">
                      {(["text", "file"] as const).map(type => (
                        <button key={type}  type='button' onClick={() => setPostType(type)} className={`cs-tab ${postType === type ? "active" : ""}`}>
                          {type === "text" ? "Announcement" : type === "file" ? "Material" : "Assignment"}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="cs-composer-row">
                    <Avatar name={user?.name || "U"} size={36} />
                    <textarea
                      className="cs-composer-input" rows={2}
                      placeholder={user?.role === "professor" ? postType === "text" ? "Share something with your class..." : "Add a description..." : "Share with your class..."}
                      value={newPostContent}
                      onChange={e => setNewPostContent(e.target.value)}
                    />
                  </div>
                  <div className="cs-composer-actions">
                    {user?.role === "professor" && (postType === "file" || postType === "assignment") && (
                      <button className="cs-btn cs-btn-ghost" type='button' onClick={() => fileInputRef.current?.click()}>
                        <AttachIcon />
                        {selectedFile ? <span className="cs-file-chip">{selectedFile.name}</span> : "Attach file"}
                      </button>
                    )}
                    <button className="cs-btn cs-btn-primary" onClick={handleCreatePost} type='button' disabled={isPosting} style={{ marginLeft: "auto" }}>
                      {isPosting ? "Posting…" : "Post"}
                    </button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: "none" }} accept=".pdf,.ppt,.pptx,.doc,.docx" />
                </div>
              )}

              {/* Posts */}
              {posts.length === 0 ? (
                <div className="cs-empty">
                  <svg width={56} height={56} fill="none" stroke="#dadce0" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p>No posts yet. Share something to get started!</p>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="cs-post">
                    <div className="cs-post-header">
                      <div className="cs-post-meta">
                        <Avatar name={post.author_name} size={40} />
                        <div className="cs-post-info">
                          <div className="cs-post-author">{post.author_name}<PostBadge type={post.post_type} /></div>
                          <div className="cs-post-time">{post.created_at}</div>
                        </div>
                      </div>
                      {user && (Number(user.id) === Number(post.user_id) || user.role === "professor") && (
                        <button className="cs-delete-post" type='button' onClick={() => handleDeletePost(post.id)}><TrashIcon size={17} /></button>
                      )}
                    </div>
                    <div className="cs-post-body">
                      {post.content && <p className="cs-post-text">{post.content}</p>}
                      {post.file_url && (
                        <a href={`http://localhost:8000${post.file_url}`} target="_blank" rel="noreferrer" className="cs-attachment">
                          <div className="cs-attachment-icon">
                            <svg width={18} height={18} fill="none" stroke="#d93025" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="cs-attachment-name">{post.file_name}</div>
                            <div className="cs-attachment-hint">Click to open</div>
                          </div>
                        </a>
                      )}
                    </div>
                    <div className="cs-comments">
                      {(post.comments?.length ?? 0) > 0 && (
                        <div className="cs-comments-label">{post.comments.length} comment{post.comments.length !== 1 ? "s" : ""}</div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(post.comments || []).map(comment => (
                          <div key={comment.id} className="cs-comment">
                            <Avatar name={comment.author_name} size={26} />
                            <div className="cs-comment-bubble">
                              <div className="cs-comment-top">
                                <span className="cs-comment-author">{comment.author_name}</span>
                                <span className="cs-comment-time">{comment.created_at}</span>
                              </div>
                              <p className="cs-comment-text">{comment.content}</p>
                            </div>
                            {user && Number(user.id) === Number(comment.user_id) && (
                              <button className="cs-comment-delete" type="button" onClick={() => handleDeleteComment(comment.id)}><TrashIcon size={14} /></button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="cs-comment-input-row">
                        <Avatar name={user?.name || "?"} size={26} />
                        <input type="text" className="cs-comment-input" placeholder="Add a class comment…"
                          value={commentInputs[post.id] || ""}
                          onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && handleAddComment(post.id)} />
                        <button className="cs-comment-post-btn" type="button" onClick={() => handleAddComment(post.id)}>Post</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* RIGHT: AI Chat */}
            <div className="cs-sidebar">
              <div className="cs-chat">
                <div className="cs-chat-header">
                  <div className="cs-chat-ai-icon">AI</div>
                  <div>
                    <div className="cs-chat-title">Course Assistant</div>
                    <div className="cs-chat-sub">Powered by course materials</div>
                  </div>
                  <div className="cs-chat-dot" />
                </div>
                <div className="cs-chat-messages">
                  {messages.length === 0 ? (
                    <div className="cs-chat-empty">
                      <svg width={40} height={40} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <p>Ask anything about your course materials</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={i} className={`cs-msg ${msg.type}`}>
                        <div className="cs-bubble">{msg.text}</div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="cs-chat-footer">
                  <input className="cs-chat-input" value={input} onChange={e => setInput(e.target.value)}
                    placeholder="Ask about the materials…" onKeyDown={e => e.key === "Enter" && handleSend()} />
                  <button className="cs-send-btn" onClick={handleSend}><SendIcon /></button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}