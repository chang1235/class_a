import React, { useState, useEffect } from 'react';
import { Student, StudentGroup, GroupConfig } from '../types';
import { soundEffects } from '../utils/audio';
import { downloadFile } from '../utils/csv';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Shuffle,
  Crown,
  Copy,
  Download,
  Check,
  Sparkles,
  ArrowRightLeft,
  Settings2,
  Printer,
} from 'lucide-react';

interface GroupingToolProps {
  students: Student[];
  onNavigateToRoster: () => void;
}

const GROUP_PALETTES = [
  {
    badge: 'bg-indigo-100 text-indigo-800',
    border: 'border-indigo-200',
    bg: 'bg-indigo-50/40',
    headerBg: 'bg-indigo-50/90',
    text: 'text-indigo-700',
  },
  {
    badge: 'bg-emerald-100 text-emerald-800',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/40',
    headerBg: 'bg-emerald-50/90',
    text: 'text-emerald-700',
  },
  {
    badge: 'bg-amber-100 text-amber-800',
    border: 'border-amber-200',
    bg: 'bg-amber-50/40',
    headerBg: 'bg-amber-50/90',
    text: 'text-amber-700',
  },
  {
    badge: 'bg-rose-100 text-rose-800',
    border: 'border-rose-200',
    bg: 'bg-rose-50/40',
    headerBg: 'bg-rose-50/90',
    text: 'text-rose-700',
  },
  {
    badge: 'bg-cyan-100 text-cyan-800',
    border: 'border-cyan-200',
    bg: 'bg-cyan-50/40',
    headerBg: 'bg-cyan-50/90',
    text: 'text-cyan-700',
  },
  {
    badge: 'bg-purple-100 text-purple-800',
    border: 'border-purple-200',
    bg: 'bg-purple-50/40',
    headerBg: 'bg-purple-50/90',
    text: 'text-purple-700',
  },
  {
    badge: 'bg-orange-100 text-orange-800',
    border: 'border-orange-200',
    bg: 'bg-orange-50/40',
    headerBg: 'bg-orange-50/90',
    text: 'text-orange-700',
  },
  {
    badge: 'bg-teal-100 text-teal-800',
    border: 'border-teal-200',
    bg: 'bg-teal-50/40',
    headerBg: 'bg-teal-50/90',
    text: 'text-teal-700',
  },
  {
    badge: 'bg-blue-100 text-blue-800',
    border: 'border-blue-200',
    bg: 'bg-blue-50/40',
    headerBg: 'bg-blue-50/90',
    text: 'text-blue-700',
  },
  {
    badge: 'bg-pink-100 text-pink-800',
    border: 'border-pink-200',
    bg: 'bg-pink-50/40',
    headerBg: 'bg-pink-50/90',
    text: 'text-pink-700',
  },
];

export function GroupingTool({ students, onNavigateToRoster }: GroupingToolProps) {
  // Configuration
  const [config, setConfig] = useState<GroupConfig>({
    mode: 'bySize', // 'bySize' (每組幾人) or 'byCount' (分幾組)
    groupSize: 4,
    groupCount: Math.max(2, Math.ceil(students.length / 4) || 2),
    remainderStrategy: 'distribute', // 'distribute' (平均分配) or 'newGroup' (獨立一組)
    pickLeader: false,
  });

  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-generate initial groups when students change and no groups yet
  useEffect(() => {
    if (students.length > 0 && groups.length === 0) {
      executeGrouping();
    }
  }, [students.length]);

  // Execute grouping calculation
  const executeGrouping = () => {
    if (students.length === 0) return;

    setIsShuffling(true);
    soundEffects.playShuffle();

    // 1. Shuffle all student names with Fisher-Yates
    const shuffledNames = students.map((s) => s.name);
    for (let i = shuffledNames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledNames[i], shuffledNames[j]] = [shuffledNames[j], shuffledNames[i]];
    }

    const totalStudents = shuffledNames.length;
    let targetGroupCount = 1;
    let targetSize = config.groupSize;

    if (config.mode === 'bySize') {
      targetSize = Math.max(1, Math.min(config.groupSize, totalStudents));
      if (config.remainderStrategy === 'distribute') {
        // e.g. 28 students with size 4 -> 7 groups
        // e.g. 29 students with size 4 -> 7 groups (one has 5)
        targetGroupCount = Math.floor(totalStudents / targetSize) || 1;
      } else {
        // e.g. 29 students with size 4 -> 8 groups (last has 1)
        targetGroupCount = Math.ceil(totalStudents / targetSize);
      }
    } else {
      // byCount
      targetGroupCount = Math.max(1, Math.min(config.groupCount, totalStudents));
    }

    // Distribute students into groups
    const resultGroups: string[][] = Array.from({ length: targetGroupCount }, () => []);

    if (config.mode === 'bySize' && config.remainderStrategy === 'newGroup') {
      // Chunk sequentially
      let studentIndex = 0;
      for (let g = 0; g < targetGroupCount; g++) {
        for (let s = 0; s < targetSize && studentIndex < totalStudents; s++) {
          resultGroups[g].push(shuffledNames[studentIndex++]);
        }
      }
    } else {
      // Round-robin distribution gives the most balanced group sizes
      shuffledNames.forEach((student, index) => {
        const groupIndex = index % targetGroupCount;
        resultGroups[groupIndex].push(student);
      });
    }

    // Build StudentGroup objects
    const finalGroups: StudentGroup[] = resultGroups.map((members, idx) => {
      const palette = GROUP_PALETTES[idx % GROUP_PALETTES.length];
      const leader = config.pickLeader && members.length > 0
        ? members[Math.floor(Math.random() * members.length)]
        : undefined;

      return {
        id: `group_${idx + 1}_${Date.now()}`,
        groupNumber: idx + 1,
        name: `第 ${idx + 1} 組`,
        color: palette,
        members,
        leader,
      };
    });

    setTimeout(() => {
      setGroups(finalGroups);
      setIsShuffling(false);
      soundEffects.playTick(1.2);
    }, 300);
  };

  // Toggle leader assignment on existing groups
  const handleToggleLeader = () => {
    const nextPickLeader = !config.pickLeader;
    setConfig((prev) => ({ ...prev, pickLeader: nextPickLeader }));

    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        leader:
          nextPickLeader && g.members.length > 0
            ? g.members[Math.floor(Math.random() * g.members.length)]
            : undefined,
      }))
    );
    soundEffects.playTick(1.1);
  };

  // Copy formatted group result to clipboard
  const handleCopyGroups = () => {
    if (groups.length === 0) return;
    const lines: string[] = [`【分組名單】共 ${groups.length} 組（${students.length} 位學生）\n`];

    groups.forEach((g) => {
      const membersText = g.members
        .map((m) => (m === g.leader ? `${m} (組長)` : m))
        .join('、');
      lines.push(`${g.name} (${g.members.length}人)：${membersText}`);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    soundEffects.playTick(1.3);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (groups.length === 0) return;
    const header = '組別,學生姓名,是否為組長\n';
    const rows: string[] = [];
    groups.forEach((g) => {
      g.members.forEach((m) => {
        const isLead = m === g.leader ? '是' : '否';
        rows.push(`${g.name},${m},${isLead}`);
      });
    });
    downloadFile(`班級分組名單_${new Date().toISOString().slice(0, 10)}.csv`, header + rows.join('\n'));
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">名單尚未建立</h3>
        <p className="text-slate-500 text-sm mt-2 mb-6">
          進行自動分組前需要先有名單，請先匯入學生名單。
        </p>
        <button
          id="btn-grouping-goto-roster"
          onClick={onNavigateToRoster}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>前往匯入學生名單（28 人範例）</span>
        </button>
      </div>
    );
  }

  // Estimated preview
  const estimatedGroupCount =
    config.mode === 'bySize'
      ? config.remainderStrategy === 'distribute'
        ? Math.floor(students.length / config.groupSize) || 1
        : Math.ceil(students.length / config.groupSize)
      : config.groupCount;

  return (
    <div className="space-y-6">
      {/* Controls & Configuration Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>智慧自動分組設定</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              依需求自訂每組人數或固定組數，一鍵隨機亂數分組。
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-shuffle-groups"
              onClick={executeGrouping}
              disabled={isShuffling}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs active:scale-98"
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>{groups.length > 0 ? '重新隨機分組' : '開始分組'}</span>
            </button>

            {groups.length > 0 && (
              <>
                <button
                  id="btn-copy-groups"
                  onClick={handleCopyGroups}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  title="複製文字名單"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">已複製！</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>複製結果</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-export-group-csv"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  title="匯出分組名單為 CSV"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>匯出 CSV</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              分組方式
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                id="btn-mode-bysize"
                onClick={() => setConfig({ ...config, mode: 'bySize' })}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  config.mode === 'bySize'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                依每組人數
              </button>
              <button
                id="btn-mode-bycount"
                onClick={() => setConfig({ ...config, mode: 'byCount' })}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  config.mode === 'byCount'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                依總組數
              </button>
            </div>
          </div>

          {/* Number Input based on mode */}
          {config.mode === 'bySize' ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                每組人數 (目前設定: {config.groupSize} 人)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="input-group-size"
                  type="range"
                  min="2"
                  max={Math.max(2, Math.min(15, students.length))}
                  value={config.groupSize}
                  onChange={(e) => setConfig({ ...config, groupSize: Number(e.target.value) })}
                  className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="w-8 text-center text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg py-0.5">
                  {config.groupSize}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                欲分成的組數 (目前設定: {config.groupCount} 組)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="input-group-count"
                  type="range"
                  min="2"
                  max={Math.max(2, Math.min(20, students.length))}
                  value={config.groupCount}
                  onChange={(e) => setConfig({ ...config, groupCount: Number(e.target.value) })}
                  className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="w-8 text-center text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg py-0.5">
                  {config.groupCount}
                </span>
              </div>
            </div>
          )}

          {/* Remainder Handling (when in bySize mode) */}
          {config.mode === 'bySize' ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                無法整除時的餘數分配
              </label>
              <select
                id="select-remainder-strategy"
                value={config.remainderStrategy}
                onChange={(e) =>
                  setConfig({ ...config, remainderStrategy: e.target.value as 'distribute' | 'newGroup' })
                }
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="distribute">平均併入各組（每組人數相近）</option>
                <option value="newGroup">獨立成最後一組（最後一組人數較少）</option>
              </select>
            </div>
          ) : (
            <div className="text-xs text-slate-500 flex items-center">
              <span>
                全班 {students.length} 人，每組約 {Math.floor(students.length / config.groupCount)} ~{' '}
                {Math.ceil(students.length / config.groupCount)} 人
              </span>
            </div>
          )}

          {/* Leader toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              小組長指派
            </label>
            <button
              id="btn-toggle-leader"
              onClick={handleToggleLeader}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                config.pickLeader
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Crown className={`w-3.5 h-3.5 ${config.pickLeader ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
              <span>{config.pickLeader ? '已啟用隨機小組長' : '隨機指定每組小組長'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visualized Group Cards Display */}
      {groups.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">點擊上方「開始分組」按鈕即可產生分組結果</p>
          <p className="text-slate-400 text-xs mt-1">目前學生人數：{students.length} 位</p>
        </div>
      ) : (
        <div>
          {/* Summary badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                分組結果總覽：共 {groups.length} 組
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                每組平均 {(students.length / groups.length).toFixed(1)} 人
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence>
              {groups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 15, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className={`rounded-2xl border ${group.color.border} ${group.color.bg} overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col`}
                >
                  {/* Card Header */}
                  <div
                    className={`p-3.5 ${group.color.headerBg} border-b ${group.color.border} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-xl ${group.color.badge} font-bold text-xs flex items-center justify-center shadow-2xs`}
                      >
                        {group.groupNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{group.name}</h4>
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-slate-700 border border-slate-200/60 shadow-2xs">
                      {group.members.length} 位組員
                    </span>
                  </div>

                  {/* Members list */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="flex flex-wrap gap-2">
                      {group.members.map((member, mIdx) => {
                        const isLeader = member === group.leader;
                        return (
                          <div
                            key={mIdx}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-transform ${
                              isLeader
                                ? 'bg-amber-100 border-amber-300 text-amber-950 shadow-xs'
                                : 'bg-white border-slate-200/80 text-slate-800 shadow-2xs hover:border-slate-300'
                            }`}
                          >
                            {isLeader && (
                              <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
                            )}
                            <span>{member}</span>
                            {isLeader && (
                              <span className="text-[10px] text-amber-700 font-bold ml-0.5">
                                組長
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {group.leader && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-500 fill-amber-400" />
                          小組長：<strong className="text-slate-800">{group.leader}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
