"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────

type Assignment = {
  id: number;
  title: string;
  description: string | null;
  deadline: string;
  question_file_url: string | null;
  question_file_name: string | null;
  created_at: string;
  submission_count?: number;
};

type Submission = {
  submitted: boolean;
  file_name?: string;
  submitted_at?: string;
  grade?: string | null;
  feedback?: string | null;
};

type ResultRow = {
  student_id: string;
  student_name: string;
  file_name: string;
  submitted_at: string;
  grade: string;
  feedback: string;
};

type Props = {
  courseId: number;
  courseCode: string;
};

// ── Grade helpers ──────────────────────────────────────────────────────────────

const GRADE_ORDER: Record<string, number> = {
  "A+": 13, "A": 12, "A-": 11,
  "B+": 10, "B": 9,  "B-": 8,
  "C+": 7,  "C": 6,  "C-": 5,
  "D+": 4,  "D": 3,  "D-": 2,
  "F": 1,   "N/A": 0, "ERROR": 0,
};

const GRADE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  "A+": { bg: "#e6f4ea", text: "#137333", border: "#34a853" },
  "A":  { bg: "#e6f4ea", text: "#137333", border: "#34a853" },
  "A-": { bg: "#e6f4ea", text: "#137333", border: "#34a853" },
  "B+": { bg: "#e8f0fe", text: "#1558d6", border: "#4285f4" },
  "B":  { bg: "#e8f0fe", text: "#1558d6", border: "#4285f4" },
  "B-": { bg: "#e8f0fe", text: "#1558d6", border: "#4285f4" },
  "C+": { bg: "#fef0cd", text: "#b06000", border: "#f9ab00" },
  "C":  { bg: "#fef0cd", text: "#b06000", border: "#f9ab00" },
  "C-": { bg: "#fef0cd", text: "#b06000", border: "#f9ab00" },
  "D+": { bg: "#fce8e6", text: "#c5221f", border: "#ea4335" },
  "D":  { bg: "#fce8e6", text: "#c5221f", border: "#ea4335" },
  "D-": { bg: "#fce8e6", text: "#c5221f", border: "#ea4335" },
  "F":  { bg: "#fce8e6", text: "#c5221f", border: "#ea4335" },
};

function gradeScore(g: string): number {
  return GRADE_ORDER[g?.trim()] ?? 0;
}

function gradeStyle(g: string) {
  return GRADE_COLOR[g?.trim()] ?? { bg: "#f1f3f4", text: "#5f6368", border: "#dadce0" };
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@300;400;500&display=swap');

  :root {
    --primary: #1a73e8;
    --primary-dark: #1557b0;
    --primary-light: #e8f0fe;
    --purple: #7c4dff;
    --purple-dark: #651fff;
    --purple-light: #ede7f6;
    --green: #188038;
    --green-light: #e6f4ea;
    --orange: #e37400;
    --orange-light: #fef0cd;
    --red: #d93025;
    --red-light: #fce8e6;
    --surface: #ffffff;
    --surface-2: #f8f9fa;
    --surface-3: #f1f3f4;
    --border: #dadce0;
    --text-primary: #202124;
    --text-secondary: #5f6368;
    --text-tertiary: #80868b;
    --shadow-1: 0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
    --shadow-2: 0 1px 3px rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15);
    --shadow-3: 0 4px 8px rgba(60,64,67,.3), 0 8px 24px 6px rgba(60,64,67,.15);
    --radius: 8px;
    --radius-lg: 12px;
    --font: 'Google Sans', 'Roboto', sans-serif;
  }

  .ap-root { font-family: var(--font); }
  .ap-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px 0; max-width: 1200px; margin: 0 auto;
  }
  .ap-header-title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
  .ap-header-icon { width: 32px; height: 32px; border-radius: 50%; background: var(--purple-light); display: flex; align-items: center; justify-content: center; }
  .ap-new-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--purple); color: white; padding: 9px 20px; border-radius: 24px;
    font-size: 13px; font-weight: 700; border: none; cursor: pointer; font-family: var(--font);
    box-shadow: var(--shadow-1); transition: all 0.15s ease;
  }
  .ap-new-btn:hover { background: var(--purple-dark); box-shadow: var(--shadow-2); }
  .ap-form-wrap { max-width: 1200px; margin: 16px auto 0; padding: 0 24px; }
  .ap-form { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-2); overflow: hidden; animation: slideDown 0.2s ease; }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .ap-form-header { padding: 16px 20px; background: linear-gradient(135deg, var(--purple) 0%, #5c35d6 100%); display: flex; align-items: center; gap: 10px; }
  .ap-form-header-title { font-size: 15px; font-weight: 700; color: white; }
  .ap-form-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .ap-input { width: 100%; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 10px 14px; font-size: 14px; font-family: var(--font); color: var(--text-primary); background: var(--surface); outline: none; transition: all 0.2s; }
  .ap-input:focus { border-color: var(--purple); box-shadow: 0 0 0 3px rgba(124,77,255,0.12); }
  .ap-input::placeholder { color: var(--text-tertiary); }
  .ap-textarea { resize: none; line-height: 1.5; }
  .ap-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.3px; margin-bottom: 5px; display: block; }
  .ap-file-btn { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1.5px dashed var(--border); border-radius: var(--radius); background: var(--surface-2); color: var(--text-secondary); font-size: 13px; font-family: var(--font); cursor: pointer; transition: all 0.15s; }
  .ap-file-btn:hover { border-color: var(--purple); color: var(--purple); background: var(--purple-light); }
  .ap-file-btn.has-file { border-style: solid; border-color: var(--purple); color: var(--purple); background: var(--purple-light); }
  .ap-form-actions { display: flex; gap: 8px; padding: 0 20px 20px; }
  .ap-btn { padding: 9px 22px; border-radius: 20px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; font-family: var(--font); transition: all 0.15s; }
  .ap-btn-primary { background: var(--purple); color: white; }
  .ap-btn-primary:hover { background: var(--purple-dark); }
  .ap-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .ap-btn-ghost { background: var(--surface-3); color: var(--text-secondary); }
  .ap-btn-ghost:hover { background: var(--border); color: var(--text-primary); }
  .ap-list { max-width: 1200px; margin: 16px auto 0; padding: 0 24px 24px; display: flex; flex-direction: column; gap: 12px; }
  .ap-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-1); overflow: hidden; transition: box-shadow 0.2s; animation: fadeUp 0.25s ease; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .ap-card:hover { box-shadow: var(--shadow-2); }
  .ap-card-stripe { height: 4px; background: linear-gradient(90deg, var(--purple) 0%, #5c35d6 100%); }
  .ap-card-stripe.closed { background: linear-gradient(90deg, var(--text-tertiary), #9e9e9e); }
  .ap-card-stripe.soon   { background: linear-gradient(90deg, var(--orange), #f57c00); }
  .ap-card-body { padding: 16px 20px; }
  .ap-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .ap-card-left { flex: 1; min-width: 0; }
  .ap-card-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
  .ap-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; }
  .ap-badge-assignment { background: var(--purple-light); color: var(--purple); }
  .ap-badge-open   { background: var(--green-light);  color: var(--green); }
  .ap-badge-soon   { background: var(--orange-light); color: var(--orange); }
  .ap-badge-closed { background: var(--red-light);    color: var(--red); }
  .ap-card-title { font-size: 15px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ap-card-desc { font-size: 13px; color: var(--text-secondary); margin-top: 4px; line-height: 1.5; }
  .ap-card-actions { display: flex; align-items: center; gap: 6px; margin-left: 8px; flex-shrink: 0; }
  .ap-card-delete { background: none; border: none; cursor: pointer; color: var(--text-tertiary); padding: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .ap-card-delete:hover { background: var(--red-light); color: var(--red); }
  .ap-deadline { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; font-size: 12px; color: var(--text-secondary); }
  .ap-deadline.passed { color: var(--red); font-weight: 600; }
  .ap-download { display: inline-flex; align-items: center; gap: 10px; margin-top: 12px; padding: 9px 14px; border: 1px solid var(--border); border-radius: var(--radius); text-decoration: none; background: var(--surface-2); transition: all 0.15s; max-width: 300px; }
  .ap-download:hover { background: var(--purple-light); border-color: var(--purple); box-shadow: var(--shadow-1); }
  .ap-download-icon { width: 32px; height: 32px; border-radius: 6px; background: var(--purple-light); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ap-download-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
  .ap-download-hint { font-size: 11px; color: var(--text-tertiary); margin-top: 1px; }
  .ap-divider { height: 1px; background: var(--surface-3); margin: 14px 0; }
  .ap-sub-section { padding-top: 2px; }
  .ap-sub-count { font-size: 12px; color: var(--text-secondary); margin-top: 10px; display: flex; align-items: center; gap: 5px; }
  .ap-submitted-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: var(--green-light); border: 1px solid rgba(24,128,56,0.2); border-radius: var(--radius); }
  .ap-submitted-icon { width: 28px; height: 28px; border-radius: 50%; background: var(--green); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .ap-submitted-label { font-size: 13px; font-weight: 700; color: var(--green); }
  .ap-submitted-file  { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
  .ap-submitted-time  { font-size: 11px; color: var(--text-tertiary); margin-top: 1px; }
  .ap-grade-box { margin-top: 10px; padding: 10px 14px; background: var(--primary-light); border: 1px solid rgba(26,115,232,0.2); border-radius: var(--radius); }
  .ap-grade-label { font-size: 13px; font-weight: 700; color: var(--primary); }
  .ap-grade-feedback { font-size: 12px; color: var(--text-secondary); margin-top: 4px; line-height: 1.5; }
  .ap-resub-label { font-size: 11px; font-weight: 600; color: var(--text-tertiary); letter-spacing: 0.5px; text-transform: uppercase; margin: 12px 0 6px; }
  .ap-upload-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ap-upload-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: var(--radius); border: 1.5px dashed var(--border); background: var(--surface-2); color: var(--text-secondary); font-size: 13px; font-family: var(--font); cursor: pointer; transition: all 0.15s; }
  .ap-upload-btn:hover { border-color: var(--purple); color: var(--purple); background: var(--purple-light); }
  .ap-upload-btn.has-file { border-style: solid; border-color: var(--purple); color: var(--purple); background: var(--purple-light); }
  .ap-submit-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 20px; border-radius: var(--radius); background: var(--purple); color: white; font-size: 13px; font-weight: 700; font-family: var(--font); border: none; cursor: pointer; transition: all 0.15s; box-shadow: var(--shadow-1); }
  .ap-submit-btn:hover { background: var(--purple-dark); }
  .ap-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ap-results-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius); background: var(--surface-2); border: 1px solid var(--border); color: var(--text-secondary); font-size: 13px; font-weight: 600; font-family: var(--font); cursor: pointer; transition: all 0.15s; }
  .ap-results-btn:hover { background: var(--primary-light); border-color: var(--primary); color: var(--primary); }
  .ap-eval-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius); background: var(--purple-light); border: 1px solid rgba(124,77,255,0.3); color: var(--purple); font-size: 13px; font-weight: 700; font-family: var(--font); cursor: pointer; transition: all 0.15s; }
  .ap-eval-btn:hover { background: var(--purple); color: white; }
  .ap-closed-msg { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--red); padding: 8px 14px; background: var(--red-light); border-radius: var(--radius); border: 1px solid rgba(217,48,37,0.2); }
  .ap-empty { text-align: center; padding: 48px 20px; color: var(--text-tertiary); font-family: var(--font); }
  .ap-empty p { font-size: 14px; }
  .ap-loading { display: flex; align-items: center; gap: 10px; padding: 20px 24px; color: var(--text-tertiary); font-size: 13px; font-family: var(--font); }
  .ap-spinner { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--purple); animation: spin 0.8s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ══════════════════════════════════════
     RESULTS MODAL
  ══════════════════════════════════════ */
  .rm-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(32,33,36,0.65);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: rmFadeIn 0.18s ease;
  }
  @keyframes rmFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .rm-modal {
    background: var(--surface); border-radius: 16px;
    box-shadow: var(--shadow-3);
    width: 100%; max-width: 900px; max-height: 90vh;
    display: flex; flex-direction: column; overflow: hidden;
    animation: rmSlideUp 0.22s ease;
  }
  @keyframes rmSlideUp { from { opacity: 0; transform: translateY(18px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

  .rm-header { padding: 20px 24px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-shrink: 0; }
  .rm-title { font-size: 19px; font-weight: 700; color: var(--text-primary); }
  .rm-subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 3px; }
  .rm-close { background: none; border: none; cursor: pointer; color: var(--text-tertiary); padding: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
  .rm-close:hover { background: var(--surface-3); color: var(--text-primary); }

  .rm-stats { display: flex; border-bottom: 1px solid var(--border); flex-shrink: 0; overflow-x: auto; }
  .rm-stat { flex: 1; min-width: 90px; padding: 12px 16px; text-align: center; border-right: 1px solid var(--border); }
  .rm-stat:last-child { border-right: none; }
  .rm-stat-val { font-size: 22px; font-weight: 700; color: var(--text-primary); line-height: 1; }
  .rm-stat-label { font-size: 10px; color: var(--text-tertiary); margin-top: 4px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }

  /* Grade distribution bar */
  .rm-dist { padding: 10px 20px 0; flex-shrink: 0; border-bottom: 1px solid var(--border); }
  .rm-dist-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.4px; text-transform: uppercase; margin-bottom: 8px; }
  .rm-dist-bars { display: flex; align-items: flex-end; gap: 6px; height: 48px; margin-bottom: 10px; }
  .rm-dist-col { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 28px; }
  .rm-dist-bar { width: 22px; border-radius: 3px 3px 0 0; transition: height 0.4s ease; }
  .rm-dist-count { font-size: 10px; color: var(--text-tertiary); font-weight: 600; }
  .rm-dist-grade { font-size: 10px; font-weight: 700; }

  .rm-body { flex: 1; overflow-y: auto; }
  .rm-body::-webkit-scrollbar { width: 5px; }
  .rm-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  .rm-table { width: 100%; border-collapse: collapse; font-family: var(--font); }
  .rm-table thead tr { background: var(--surface-2); position: sticky; top: 0; z-index: 1; }
  .rm-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.5px; text-transform: uppercase; border-bottom: 1px solid var(--border); }
  .rm-table th.center { text-align: center; }
  .rm-table td { padding: 13px 16px; border-bottom: 1px solid var(--surface-3); font-size: 13px; color: var(--text-primary); vertical-align: middle; }
  .rm-table tr:last-child td { border-bottom: none; }
  .rm-table tbody tr { transition: background 0.1s; }
  .rm-table tbody tr:hover { background: #fafbff; }

  .rm-rank { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
  .rm-rank-1 { background: #ffd700; color: #6a4400; font-size: 15px; }
  .rm-rank-2 { background: #e0e0e0; color: #424242; font-size: 15px; }
  .rm-rank-3 { background: #cd7f32; color: #fff; font-size: 15px; }
  .rm-rank-n { background: var(--surface-3); color: var(--text-secondary); }

  .rm-grade-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; padding: 4px 10px; border-radius: 20px; font-size: 14px; font-weight: 800; border: 1.5px solid; letter-spacing: 0.3px; }

  .rm-student-name { font-weight: 600; color: var(--text-primary); font-size: 13px; }
  .rm-student-id   { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
  .rm-file { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }
  .rm-feedback { font-size: 12px; color: var(--text-secondary); line-height: 1.55; max-width: 280px; }
  .rm-no-feedback { font-size: 12px; color: var(--text-tertiary); font-style: italic; }
  .rm-time { font-size: 11px; color: var(--text-tertiary); white-space: nowrap; }

  .rm-center { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px 20px; gap: 12px; color: var(--text-tertiary); }
  .rm-center p { font-size: 14px; }
  .rm-spinner-lg { width: 32px; height: 32px; border-radius: 50%; border: 3px solid var(--border); border-top-color: var(--purple); animation: spin 0.8s linear infinite; }

  .rm-footer { padding: 12px 24px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--surface-2); flex-shrink: 0; }
  .rm-footer-info { font-size: 12px; color: var(--text-tertiary); }
  .rm-footer-actions { display: flex; gap: 8px; }
  .rm-footer-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; font-family: var(--font); cursor: pointer; border: none; transition: all 0.15s; }
  .rm-footer-btn-primary { background: var(--primary); color: white; }
  .rm-footer-btn-primary:hover { background: var(--primary-dark); }
  .rm-footer-btn-ghost { background: var(--surface-3); color: var(--text-secondary); }
  .rm-footer-btn-ghost:hover { background: var(--border); color: var(--text-primary); }
`;

// ── Icons ──────────────────────────────────────────────────────────────────────

function Icon({ d, size = 16, ...rest }: { d: string; size?: number; [k: string]: any }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

const ICONS = {
  plus:     "M12 4v16m8-8H4",
  trash:    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  attach:   "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.585a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  file:     "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  upload:   "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  check:    "M5 13l4 4L19 7",
  users:    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  lock:     "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  clip:     "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  chart:    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  x:        "M6 18L18 6M6 6l12 12",
};

// ── Grade Distribution Bar Chart ──────────────────────────────────────────────

const DIST_GROUPS = ["A", "B", "C", "D", "F"];
const DIST_COLORS: Record<string, string> = {
  "A": "#34a853", "B": "#4285f4", "C": "#f9ab00", "D": "#ea4335", "F": "#d93025",
};

function GradeDistBar({ results }: { results: ResultRow[] }) {
  const graded = results.filter(r => r.grade && r.grade !== "" && r.grade !== "N/A" && r.grade !== "ERROR");
  if (graded.length === 0) return null;

  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  graded.forEach(r => {
    const letter = r.grade.trim()[0].toUpperCase();
    if (counts[letter] !== undefined) counts[letter]++;
  });

  const max = Math.max(...Object.values(counts), 1);

  return (
    <div className="rm-dist">
      <div className="rm-dist-label">Grade Distribution</div>
      <div className="rm-dist-bars">
        {DIST_GROUPS.map(g => (
          <div className="rm-dist-col" key={g}>
            <div className="rm-dist-count">{counts[g] || ""}</div>
            <div
              className="rm-dist-bar"
              style={{
                height: `${Math.max((counts[g] / max) * 36, counts[g] > 0 ? 6 : 0)}px`,
                background: DIST_COLORS[g],
                opacity: counts[g] > 0 ? 1 : 0.15,
              }}
            />
            <div className="rm-dist-grade" style={{ color: DIST_COLORS[g] }}>{g}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Results Modal ──────────────────────────────────────────────────────────────

function ResultsModal({
  assignment,
  courseCode,
  onClose,
  userToken,
}: {
  assignment: Assignment;
  courseCode: string;
  onClose: () => void;
  userToken?: string;
}) {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:8000/api/evaluation/assignments/${assignment.id}/results?course_code=${courseCode}`,
          { headers: userToken ? { Authorization: `Bearer ${userToken}` } : {} }
        );
        if (!res.ok) throw new Error("Failed to load results");
        const data = await res.json();
        setResults(data.results ?? []);
      } catch (e: any) {
        setError(e.message || "Could not load results");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [assignment.id, courseCode]);

  const sorted = [...results].sort((a, b) => gradeScore(b.grade) - gradeScore(a.grade));
  const graded = sorted.filter(r => r.grade && r.grade !== "N/A" && r.grade !== "ERROR" && r.grade !== "");
  const topGrade = graded[0]?.grade ?? "—";
  const pctGraded = sorted.length > 0 ? Math.round((graded.length / sorted.length) * 100) : 0;

  const handleDownload = () => {
    window.open(
      `http://localhost:8000/uploads/assignments/${courseCode}/${assignment.id}/results/results.csv`,
      "_blank"
    );
  };

  return (
    <div className="rm-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rm-modal">

        {/* Header */}
        <div className="rm-header">
          <div>
            <div className="rm-title">📊 Grading Results</div>
            <div className="rm-subtitle">{assignment.title}</div>
          </div>
          <button className="rm-close" onClick={onClose}>
            <Icon d={ICONS.x} size={20} />
          </button>
        </div>

        {/* Stats */}
        {!isLoading && !error && sorted.length > 0 && (
          <>
            <div className="rm-stats">
              <div className="rm-stat">
                <div className="rm-stat-val">{sorted.length}</div>
                <div className="rm-stat-label">Submitted</div>
              </div>
              <div className="rm-stat">
                <div className="rm-stat-val">{graded.length}</div>
                <div className="rm-stat-label">Graded</div>
              </div>
              <div className="rm-stat">
                <div className="rm-stat-val" style={{ color: gradeStyle(topGrade).text }}>{topGrade}</div>
                <div className="rm-stat-label">Top Grade</div>
              </div>
              <div className="rm-stat">
                <div className="rm-stat-val">{pctGraded}%</div>
                <div className="rm-stat-label">Evaluated</div>
              </div>
            </div>
            <GradeDistBar results={sorted} />
          </>
        )}

        {/* Table */}
        <div className="rm-body">
          {isLoading ? (
            <div className="rm-center">
              <div className="rm-spinner-lg" />
              <p>Loading results…</p>
            </div>
          ) : error ? (
            <div className="rm-center">
              <svg width={44} height={44} fill="none" stroke="#d93025" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p style={{ color: "#d93025" }}>{error}</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="rm-center">
              <svg width={52} height={52} fill="none" stroke="#dadce0" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS.chart} />
              </svg>
              <p>No results yet — run evaluation first.</p>
            </div>
          ) : (
            <table className="rm-table">
              <thead>
                <tr>
                  <th style={{ width: 52 }}>#</th>
                  <th>Student</th>
                  <th className="center" style={{ width: 76 }}>Grade</th>
                  <th>Feedback</th>
                  <th>File</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => {
                  const gs   = gradeStyle(row.grade);
                  const rank = i + 1;
                  return (
                    <tr key={`${row.student_id}-${i}`}>
                      <td>
                        <div className={`rm-rank ${rank === 1 ? "rm-rank-1" : rank === 2 ? "rm-rank-2" : rank === 3 ? "rm-rank-3" : "rm-rank-n"}`}>
                          {rank <= 3 ? ["🥇","🥈","🥉"][rank - 1] : rank}
                        </div>
                      </td>
                      <td>
                        <div className="rm-student-name">{row.student_name || `Student #${row.student_id}`}</div>
                        <div className="rm-student-id">ID: {row.student_id}</div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.grade ? (
                          <span className="rm-grade-pill" style={{ background: gs.bg, color: gs.text, borderColor: gs.border }}>
                            {row.grade}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        {row.feedback
                          ? <div className="rm-feedback">{row.feedback}</div>
                          : <div className="rm-no-feedback">No feedback yet</div>}
                      </td>
                      <td>
                        <div className="rm-file">
                          <Icon d={ICONS.file} size={12} style={{ color: "var(--purple)", flexShrink: 0 }} />
                          {row.file_name || "—"}
                        </div>
                      </td>
                      <td>
                        <div className="rm-time">
                          {row.submitted_at
                            ? new Date(row.submitted_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="rm-footer">
          <div className="rm-footer-info">
            {sorted.length > 0 && `${sorted.length} student${sorted.length !== 1 ? "s" : ""} · sorted by grade (highest first)`}
          </div>
          <div className="rm-footer-actions">
            <button className="rm-footer-btn rm-footer-btn-ghost" onClick={onClose}>Close</button>
            <button className="rm-footer-btn rm-footer-btn-primary" onClick={handleDownload}>
              <Icon d={ICONS.download} size={13} style={{ color: "white" }} />
              Download CSV
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AssignmentPanel({ courseId, courseCode }: Props) {
  const { user } = useAuth();
  const isProfessor = user?.role === "professor";

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submissions, setSubmissions] = useState<{ [id: number]: Submission }>({});
  const [submitFiles, setSubmitFiles] = useState<{ [id: number]: File | null }>({});
  const [isSubmitting, setIsSubmitting] = useState<{ [id: number]: boolean }>({});
  const submitInputRefs = useRef<{ [id: number]: HTMLInputElement | null }>({});

  const [resultsAssignment, setResultsAssignment] = useState<Assignment | null>(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/assignments/course/${courseId}`);
      if (!res.ok) throw new Error();
      const data: Assignment[] = await res.json();
      setAssignments(data);
      if (!isProfessor && user?.id) {
        const statuses: { [id: number]: Submission } = {};
        await Promise.all(data.map(async (a) => {
          const r = await fetch(`http://localhost:8000/api/assignments/${a.id}/submission/${user.id}`);
          if (r.ok) statuses[a.id] = await r.json();
        }));
        setSubmissions(statuses);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAssignments(); }, [courseId]);

  const handleCreate = async () => {
    if (!title || !deadline || !user) return;
    setIsCreating(true);
    const fd = new FormData();
    fd.append("course_id", courseId.toString());
    fd.append("course_code", courseCode);
    fd.append("title", title);
    fd.append("description", description);
    fd.append("deadline", deadline);
    fd.append("created_by", user.id.toString());
    if (file) fd.append("file", file);
    try {
      const res = await fetch("http://localhost:8000/api/assignments/", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        body: fd,
      });
      if (res.ok) { setTitle(""); setDescription(""); setDeadline(""); setFile(null); setShowForm(false); fetchAssignments(); }
      else alert("Failed to create assignment");
    } catch (e) { console.error(e); }
    finally { setIsCreating(false); }
  };

  const handleEvaluate = async (assignmentId: number) => {
    try {
      const fd = new FormData();
      fd.append("course_code", courseCode);
      const res = await fetch(`http://localhost:8000/api/evaluation/assignments/${assignmentId}/evaluate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}` },
        body: fd,
      });
      if (res.ok) { alert("Evaluation complete!"); fetchAssignments(); }
      else alert("Evaluation failed");
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (id: number) => {
    const f = submitFiles[id];
    if (!f || !user) return;
    setIsSubmitting(p => ({ ...p, [id]: true }));
    const fd = new FormData();
    fd.append("course_code", courseCode);
    fd.append("student_id", user.id.toString());
    fd.append("file", f);
    try {
      const res = await fetch(`http://localhost:8000/api/assignments/${id}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        body: fd,
      });
      if (res.ok) { setSubmitFiles(p => ({ ...p, [id]: null })); fetchAssignments(); }
      else { const e = await res.json(); alert(e.detail || "Submission failed"); }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(p => ({ ...p, [id]: false })); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this assignment and all its submissions?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/assignments/${id}?course_code=${courseCode}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user!.token}` },
      });
      if (res.ok) fetchAssignments();
    } catch (e) { console.error(e); }
  };

  const isPassed = (d: string) => new Date() > new Date(d);
  const formatDL = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const getStatus = (d: string) => {
    const diff = new Date(d).getTime() - Date.now();
    if (diff < 0) return { label: "Closed",   cls: "ap-badge-closed", stripe: "closed" };
    if (diff < 86400000) return { label: "Due Soon", cls: "ap-badge-soon",   stripe: "soon"   };
    return { label: "Open",   cls: "ap-badge-open",  stripe: "" };
  };

  return (
    <div className="ap-root">
      <style>{styles}</style>

      {resultsAssignment && (
        <ResultsModal
          assignment={resultsAssignment}
          courseCode={courseCode}
          onClose={() => setResultsAssignment(null)}
          userToken={user?.token}
        />
      )}

      <div className="ap-header">
        <div className="ap-header-title">
          <div className="ap-header-icon">
            <Icon d={ICONS.clip} size={16} style={{ color: "var(--purple)" }} />
          </div>
          Assignments
          {assignments.length > 0 && (
            <span style={{ background: "var(--purple-light)", color: "var(--purple)", borderRadius: 12, padding: "1px 9px", fontSize: 12, fontWeight: 700 }}>
              {assignments.length}
            </span>
          )}
        </div>
        {isProfessor && !showForm && (
          <button className="ap-new-btn" onClick={() => setShowForm(true)}>
            <Icon d={ICONS.plus} size={14} />
            New Assignment
          </button>
        )}
      </div>

      {showForm && (
        <div className="ap-form-wrap">
          <div className="ap-form">
            <div className="ap-form-header">
              <Icon d={ICONS.clip} size={16} style={{ color: "rgba(255,255,255,0.9)" }} />
              <span className="ap-form-header-title">Create Assignment</span>
            </div>
            <div className="ap-form-body">
              <div>
                <label className="ap-label">Title *</label>
                <input className="ap-input" type="text" placeholder="e.g. Chapter 3 Problem Set" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="ap-label">Description</label>
                <textarea className="ap-input ap-textarea" rows={2} placeholder="Instructions, context, or notes…" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="ap-label">Deadline *</label>
                <input className="ap-input" type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
              <div>
                <label className="ap-label">Question File (optional)</label>
                <button className={`ap-file-btn ${file ? "has-file" : ""}`} onClick={() => fileInputRef.current?.click()}>
                  <Icon d={ICONS.attach} size={15} />
                  {file ? file.name : "Attach question file"}
                </button>
                <input type="file" ref={fileInputRef} onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: "none" }} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" />
              </div>
            </div>
            <div className="ap-form-actions">
              <button className="ap-btn ap-btn-primary" onClick={handleCreate} disabled={isCreating || !title || !deadline}>
                {isCreating ? "Creating…" : "Create Assignment"}
              </button>
              <button className="ap-btn ap-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="ap-loading">
          <div className="ap-spinner" />
          Loading assignments…
        </div>
      )}

      {!isLoading && (
        <div className="ap-list">
          {assignments.length === 0 ? (
            <div className="ap-empty">
              <svg width={48} height={48} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: "block", margin: "0 auto 10px", opacity: 0.25 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS.clip} />
              </svg>
              <p>No assignments yet{isProfessor ? " — create one above!" : "."}</p>
            </div>
          ) : (
            assignments.map(a => {
              const status     = getStatus(a.deadline);
              const passed     = isPassed(a.deadline);
              const sub        = submissions[a.id];
              const sf         = submitFiles[a.id];
              const submitting = isSubmitting[a.id];

              return (
                <div key={a.id} className="ap-card">
                  <div className={`ap-card-stripe ${status.stripe}`} />
                  <div className="ap-card-body">
                    <div className="ap-card-top">
                      <div className="ap-card-left">
                        <div className="ap-card-badges">
                          <span className="ap-badge ap-badge-assignment">Assignment</span>
                          <span className={`ap-badge ${status.cls}`}>{status.label}</span>
                        </div>
                        <div className="ap-card-title">{a.title}</div>
                        {a.description && <p className="ap-card-desc">{a.description}</p>}
                      </div>
                      {isProfessor && (
                        <div className="ap-card-actions">
                          <button className="ap-card-delete" onClick={() => handleDelete(a.id)} title="Delete">
                            <Icon d={ICONS.trash} size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={`ap-deadline ${passed ? "passed" : ""}`}>
                      <Icon d={ICONS.calendar} size={13} />
                      Due: {formatDL(a.deadline)}
                    </div>

                    {a.question_file_url && (
                      <a href={`http://localhost:8000${a.question_file_url}`} target="_blank" rel="noreferrer" className="ap-download ml-6">
                        <div className="ap-download-icon">
                          <Icon d={ICONS.file} size={15} style={{ color: "var(--purple)" }} />
                        </div>
                        <div>
                          <div className="ap-download-name">{a.question_file_name}</div>
                          <div className="ap-download-hint">Download question</div>
                        </div>
                      </a>
                    )}

                    {isProfessor && (
                      <>
                        <div className="ap-sub-count">
                          <Icon d={ICONS.users} size={13} />
                          {a.submission_count ?? 0} submission{a.submission_count !== 1 ? "s" : ""} received
                        </div>
                        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="ap-eval-btn" onClick={() => handleEvaluate(a.id)}>
                            🤖 Evaluate Submissions
                          </button>
                          <button className="ap-results-btn" onClick={() => setResultsAssignment(a)}>
                            <Icon d={ICONS.chart} size={14} />
                            View Results
                          </button>
                        </div>
                      </>
                    )}

                    {!isProfessor && (
                      <>
                        <div className="ap-divider" />
                        <div className="ap-sub-section">
                          {sub?.submitted ? (
                            <>
                              <div className="ap-submitted-row">
                                <div className="ap-submitted-icon">
                                  <Icon d={ICONS.check} size={14} style={{ color: "white" }} />
                                </div>
                                <div>
                                  <div className="ap-submitted-label">Submitted</div>
                                  <div className="ap-submitted-file">{sub.file_name}</div>
                                  {sub.submitted_at && <div className="ap-submitted-time">{new Date(sub.submitted_at).toLocaleString()}</div>}
                                </div>
                              </div>
                              {sub.grade && (
                                <div className="ap-grade-box">
                                  <div className="ap-grade-label">Grade: {sub.grade}</div>
                                  {sub.feedback && <div className="ap-grade-feedback">{sub.feedback}</div>}
                                </div>
                              )}
                              {!passed && (
                                <>
                                  <div className="ap-resub-label">Resubmit</div>
                                  <div className="ap-upload-row">
                                    <button className={`ap-upload-btn ${sf ? "has-file" : ""}`} onClick={() => submitInputRefs.current[a.id]?.click()}>
                                      <Icon d={ICONS.upload} size={14} />
                                      {sf ? sf.name : "Choose file"}
                                    </button>
                                    {sf && (
                                      <button className="ap-submit-btn" onClick={() => handleSubmit(a.id)} disabled={submitting}>
                                        <Icon d={ICONS.upload} size={13} style={{ color: "white" }} />
                                        {submitting ? "Uploading…" : "Resubmit"}
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </>
                          ) : passed ? (
                            <div className="ap-closed-msg">
                              <Icon d={ICONS.lock} size={14} />
                              Deadline passed — submissions closed
                            </div>
                          ) : (
                            <div className="ap-upload-row">
                              <button className={`ap-upload-btn ${sf ? "has-file" : ""}`} onClick={() => submitInputRefs.current[a.id]?.click()}>
                                <Icon d={ICONS.upload} size={14} />
                                {sf ? sf.name : "Choose file to submit"}
                              </button>
                              {sf && (
                                <button className="ap-submit-btn" onClick={() => handleSubmit(a.id)} disabled={submitting}>
                                  <Icon d={ICONS.upload} size={13} style={{ color: "white" }} />
                                  {submitting ? "Uploading…" : "Submit"}
                                </button>
                              )}
                            </div>
                          )}
                          <input
                            type="file"
                            ref={el => { submitInputRefs.current[a.id] = el; }}
                            onChange={e => setSubmitFiles(p => ({ ...p, [a.id]: e.target.files?.[0] || null }))}
                            style={{ display: "none" }}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}