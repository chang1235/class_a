import React, { useState, useEffect } from 'react';
import { Student, ActiveTab } from './types';
import { SAMPLE_STUDENTS, namesToStudents } from './utils/csv';
import { Navbar } from './components/Navbar';
import { RandomPicker } from './components/RandomPicker';
import { GroupingTool } from './components/GroupingTool';
import { RosterManager } from './components/RosterManager';
import { Sparkles, Users, UserCheck } from 'lucide-react';

const STORAGE_KEY_STUDENTS = 'classroom_students_v1';

export default function App() {
  // Load initial students from localStorage or fallback to sample list
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    // Default initial roster so teacher has a live working experience immediately
    return namesToStudents(SAMPLE_STUDENTS);
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('picker');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Persist students to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  const handleResetRoster = () => {
    setStudents(namesToStudents(SAMPLE_STUDENTS));
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentCount={students.length}
        onResetRoster={handleResetRoster}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Main Classroom Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'grouping' && (
          <GroupingTool
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            setStudents={setStudents}
          />
        )}
      </main>

      {/* Clean Classroom Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>課堂小幫手 • 支援 CSV 匯入、快速貼上、音效動畫抽籤與自訂分組</span>
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <button
              onClick={() => setActiveTab('picker')}
              className="hover:text-indigo-600 transition-colors"
            >
              抽籤
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('grouping')}
              className="hover:text-indigo-600 transition-colors"
            >
              分組
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('roster')}
              className="hover:text-indigo-600 transition-colors"
            >
              名單管理
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
