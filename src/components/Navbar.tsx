import { useState } from 'react';
import { ActiveTab } from '../types';
import { Sparkles, Users, UserCheck, Volume2, VolumeX, BookOpen, RotateCcw } from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  studentCount: number;
  onResetRoster: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  studentCount,
  onResetRoster,
  soundEnabled,
  setSoundEnabled,
}: NavbarProps) {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEffects.enabled = next;
    if (next) soundEffects.playTick(1.2);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                課堂小幫手
                <span className="hidden sm:inline-flex text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  教師專用
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">隨機抽籤 • 視覺化分組 • 名單管理</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-sm font-medium">
            <button
              id="tab-picker"
              onClick={() => setActiveTab('picker')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all duration-150 ${
                activeTab === 'picker'
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === 'picker' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>隨機抽籤</span>
            </button>

            <button
              id="tab-grouping"
              onClick={() => setActiveTab('grouping')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all duration-150 ${
                activeTab === 'grouping'
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'grouping' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>自動分組</span>
            </button>

            <button
              id="tab-roster"
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all duration-150 ${
                activeTab === 'roster'
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <UserCheck className={`w-4 h-4 ${activeTab === 'roster' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>學生名單</span>
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  studentCount > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {studentCount}
              </span>
            </button>
          </nav>

          {/* Quick controls */}
          <div className="flex items-center gap-2">
            <button
              id="btn-sound-toggle"
              onClick={toggleSound}
              title={soundEnabled ? '音效開啟（點擊靜音）' : '音效已靜音（點擊開啟）'}
              aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-slate-50 text-indigo-600 border-slate-200 hover:bg-slate-100'
                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200/60'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
