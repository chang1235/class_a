import React, { useState, useEffect, useRef } from 'react';
import { Student, DrawRecord } from '../types';
import { soundEffects } from '../utils/audio';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  History,
  CheckCircle,
  Users,
  Award,
  Undo2,
  Settings2,
  Play,
} from 'lucide-react';

interface RandomPickerProps {
  students: Student[];
  onNavigateToRoster: () => void;
}

export function RandomPicker({ students, onNavigateToRoster }: RandomPickerProps) {
  // Settings
  const [allowRepeat, setAllowRepeat] = useState<boolean>(false);
  const [speedMode, setSpeedMode] = useState<'fast' | 'normal' | 'suspense'>('normal');

  // Drawing state
  const [isRolling, setIsRolling] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState<string>('準備抽籤');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Pools
  const [drawnStudentIds, setDrawnStudentIds] = useState<string[]>([]);
  const [drawHistory, setDrawHistory] = useState<DrawRecord[]>([]);

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rollIntervalRef = useRef<number | null>(null);
  const rollTimeoutRef = useRef<number | null>(null);

  // Remaining eligible students
  const eligibleStudents = allowRepeat
    ? students
    : students.filter((s) => !drawnStudentIds.includes(s.id));

  // Handle Spacebar hotkey to draw
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRolling && students.length > 0) {
        // Prevent default spacebar scroll
        const target = e.target as HTMLElement;
        if (target && ['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return;
        e.preventDefault();
        handleStartDraw();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRolling, students, drawnStudentIds, allowRepeat, speedMode]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
    };
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.65 },
      colors: ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
    });
  };

  const handleStartDraw = () => {
    if (students.length === 0) return;
    if (eligibleStudents.length === 0) {
      alert('所有學生都已抽過！請點擊「重設名單」以開啟新一輪抽籤。');
      return;
    }

    setIsRolling(true);
    setSelectedStudent(null);

    // Pick final target in advance
    const randomIndex = Math.floor(Math.random() * eligibleStudents.length);
    const chosenOne = eligibleStudents[randomIndex];

    // Determine rolling duration based on speedMode
    const duration = speedMode === 'fast' ? 1400 : speedMode === 'normal' ? 2600 : 3800;
    const startTime = Date.now();

    let tickCounter = 0;
    let currentInterval = 50;

    const runRollingStep = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      // Pick a random name from ALL students for visual excitement
      const tempIndex = Math.floor(Math.random() * students.length);
      setCurrentDisplayName(students[tempIndex].name);

      tickCounter++;
      // Synthesize sound tick with slight frequency changes
      const pitch = 0.9 + (tickCounter % 5) * 0.08;
      soundEffects.playTick(pitch);

      if (progress < 1) {
        // Deceleration easing formula
        if (progress > 0.65) {
          // Slow down exponentially in the final 35% of time
          currentInterval = 50 + Math.pow((progress - 0.65) / 0.35, 2.5) * 260;
          if (progress > 0.8 && tickCounter % 4 === 0) {
            soundEffects.playSuspense();
          }
        }
        rollTimeoutRef.current = window.setTimeout(runRollingStep, currentInterval);
      } else {
        // Stop on target
        setCurrentDisplayName(chosenOne.name);
        setSelectedStudent(chosenOne);
        setIsRolling(false);

        // Play victory sounds and fanfare
        soundEffects.playFanfare();
        triggerConfetti();

        // Update pools
        if (!allowRepeat) {
          setDrawnStudentIds((prev) => [...prev, chosenOne.id]);
        }

        // Add to history
        setDrawHistory((prev) => [
          {
            id: `record_${Date.now()}`,
            studentName: chosenOne.name,
            timestamp: Date.now(),
            order: prev.length + 1,
          },
          ...prev,
        ]);
      }
    };

    runRollingStep();
  };

  const handleResetPool = () => {
    setDrawnStudentIds([]);
    soundEffects.playReset();
  };

  const handleClearHistory = () => {
    if (window.confirm('確定要清空抽籤歷史紀錄嗎？')) {
      setDrawHistory([]);
      soundEffects.playReset();
    }
  };

  const handlePutBack = (studentId: string) => {
    setDrawnStudentIds((prev) => prev.filter((id) => id !== studentId));
    soundEffects.playTick(1.0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">名單尚未建立</h3>
        <p className="text-slate-500 text-sm mt-2 mb-6">
          抽籤前需要先有名單，您可以直接貼上學生姓名或上傳 CSV 檔案。
        </p>
        <button
          id="btn-goto-roster"
          onClick={onNavigateToRoster}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>前往建立名單（可載入 28 人範例）</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`space-y-6 ${isFullscreen ? 'bg-slate-900 p-8 min-h-screen text-white' : ''}`}>
      {/* Settings Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Allow Repeat Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">抽籤模式</span>
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                id="btn-mode-norepeat"
                onClick={() => setAllowRepeat(false)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  !allowRepeat
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                不重複抽取
              </button>
              <button
                id="btn-mode-repeat"
                onClick={() => setAllowRepeat(true)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  allowRepeat
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                允許重複抽取
              </button>
            </div>
          </div>

          {/* Speed Mode */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">動畫節奏</span>
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                id="btn-speed-fast"
                onClick={() => setSpeedMode('fast')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  speedMode === 'fast' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                快速 (1.5秒)
              </button>
              <button
                id="btn-speed-normal"
                onClick={() => setSpeedMode('normal')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  speedMode === 'normal' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                標準 (2.5秒)
              </button>
              <button
                id="btn-speed-suspense"
                onClick={() => setSpeedMode('suspense')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  speedMode === 'suspense' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                懸疑加長 (3.8秒)
              </button>
            </div>
          </div>
        </div>

        {/* Fullscreen & Stats summary */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-medium">
            {!allowRepeat ? (
              <span>
                待抽池：<strong className="text-indigo-600">{eligibleStudents.length}</strong> / {students.length} 人
              </span>
            ) : (
              <span>
                全班：<strong className="text-indigo-600">{students.length}</strong> 人可重複抽
              </span>
            )}
          </div>

          <button
            id="btn-toggle-fullscreen"
            onClick={toggleFullscreen}
            title={isFullscreen ? '退出全螢幕投影' : '全螢幕投影模式（適合班級大螢幕）'}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Lucky Draw Stage */}
      <div className="relative overflow-hidden bg-radial from-indigo-50/50 via-white to-slate-50 rounded-3xl border-2 border-indigo-100/80 p-8 sm:p-14 shadow-sm text-center">
        {/* Ambient background glow accents */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          {/* Status badge */}
          <div className="mb-4">
            {isRolling ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                正在抽籤中...
              </span>
            ) : selectedStudent ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                第 {drawHistory.length} 位抽中學生
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                按空白鍵 [Space] 或點擊下方按鈕開始
              </span>
            )}
          </div>

          {/* High Energy Rolling Card */}
          <div className="w-full my-4 py-8 px-6 bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/90 shadow-md flex items-center justify-center min-h-[190px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={isRolling ? currentDisplayName : selectedStudent?.id || 'idle'}
                initial={{ scale: isRolling ? 0.95 : 0.8, opacity: 0, y: isRolling ? 12 : -10 }}
                animate={{ scale: isRolling ? 1 : 1.08, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="flex flex-col items-center"
              >
                {selectedStudent && !isRolling && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-xs"
                  >
                    <Award className="w-6 h-6" />
                  </motion.div>
                )}

                <h1
                  className={`font-black tracking-tight select-none transition-colors ${
                    isRolling
                      ? 'text-4xl sm:text-6xl text-indigo-500 font-mono tracking-widest'
                      : selectedStudent
                      ? 'text-5xl sm:text-7xl text-indigo-950 scale-105 drop-shadow-xs'
                      : 'text-3xl sm:text-5xl text-slate-400 font-normal'
                  }`}
                >
                  {isRolling ? currentDisplayName : selectedStudent ? selectedStudent.name : '點擊開始抽籤'}
                </h1>

                {selectedStudent && !isRolling && selectedStudent.number && (
                  <p className="text-sm font-semibold text-slate-500 mt-2">
                    座號：{selectedStudent.number} 號
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Button */}
          <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
            <button
              id="btn-trigger-draw"
              onClick={handleStartDraw}
              disabled={isRolling || eligibleStudents.length === 0}
              className={`inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-md active:scale-98 ${
                eligibleStudents.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : isRolling
                  ? 'bg-amber-500 text-white cursor-wait opacity-90'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-200 hover:shadow-lg'
              }`}
            >
              {isRolling ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>抽籤中...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>{selectedStudent ? '再抽一位 (Space)' : '開始抽籤 (Space)'}</span>
                </>
              )}
            </button>

            {!allowRepeat && drawnStudentIds.length > 0 && (
              <button
                id="btn-reset-pool"
                onClick={handleResetPool}
                disabled={isRolling}
                className="inline-flex items-center gap-1.5 px-4 py-4 rounded-2xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs"
                title="將所有已抽過的學生放回待抽池"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <span>重設待抽池</span>
              </button>
            )}
          </div>

          {/* Non-repeat alert message if empty */}
          {!allowRepeat && eligibleStudents.length === 0 && students.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                全班 {students.length} 位學生皆已抽籤完畢！可點擊上方「重設待抽池」開始新一輪。
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Pool status & Draw History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Pool Status (Eligible vs Drawn) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <span>抽籤名單狀態</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {!allowRepeat ? '不重複模式' : '可重複模式'}
              </span>
            </h3>
            <div className="text-xs text-slate-500">
              待抽：<strong className="text-indigo-600 font-bold">{eligibleStudents.length}</strong> 人 / 已抽：
              <strong className="text-emerald-600 font-bold">{drawnStudentIds.length}</strong> 人
            </div>
          </div>

          {/* Already Drawn Students List (Chips) */}
          {!allowRepeat && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>已抽出學生 ({drawnStudentIds.length})</span>
                {drawnStudentIds.length > 0 && (
                  <span className="text-slate-400 font-normal">點擊「放回」可重新加入待抽池</span>
                )}
              </p>

              {drawnStudentIds.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">尚未抽出任何學生</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {drawnStudentIds.map((id) => {
                    const stu = students.find((s) => s.id === id);
                    if (!stu) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-medium group"
                      >
                        <span>{stu.name}</span>
                        <button
                          onClick={() => handlePutBack(id)}
                          title="放回待抽池"
                          className="text-emerald-500 hover:text-emerald-800 rounded p-0.5"
                        >
                          <Undo2 className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Remaining in pool */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              待抽池學生 ({eligibleStudents.length})
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {eligibleStudents.map((stu) => (
                <span
                  key={stu.id}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  {stu.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Draw History */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>抽籤歷程紀錄</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {drawHistory.length}
              </span>
            </h3>

            {drawHistory.length > 0 && (
              <button
                id="btn-clear-history"
                onClick={handleClearHistory}
                className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors"
              >
                清除紀錄
              </button>
            )}
          </div>

          {drawHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              尚未產生抽籤紀錄，按下抽籤後將自動在此按序呈現
            </div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto pr-1 divide-y divide-slate-100">
              {drawHistory.map((record, idx) => (
                <div key={record.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 text-xs font-mono font-bold flex items-center justify-center">
                      {record.order}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{record.studentName}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
