import React, { useState, useRef } from 'react';
import { Student } from '../types';
import {
  parsePastedNames,
  parseCSVContent,
  SAMPLE_STUDENTS,
  namesToStudents,
  downloadFile,
} from '../utils/csv';
import {
  Upload,
  FileSpreadsheet,
  ClipboardPaste,
  UserPlus,
  Trash2,
  Download,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface RosterManagerProps {
  students: Student[];
  setStudents: (students: Student[]) => void;
  onRosterUpdated?: () => void;
}

export function RosterManager({ students, setStudents, onRosterUpdated }: RosterManagerProps) {
  const [activeInputMode, setActiveInputMode] = useState<'paste' | 'upload'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [pastePreviewCount, setPastePreviewCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview count when pastedText changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPastedText(val);
    const parsed = parsePastedNames(val);
    setPastePreviewCount(parsed.length);
  };

  const handleApplyPasted = () => {
    const names = parsePastedNames(pastedText);
    if (names.length === 0) {
      setStatusMessage({ type: 'error', text: '請輸入有效的學生姓名' });
      return;
    }
    const newStudents = namesToStudents(names);
    setStudents(newStudents);
    soundEffects.playShuffle();
    setStatusMessage({ type: 'success', text: `成功匯入 ${names.length} 位學生名單！` });
    setPastedText('');
    setPastePreviewCount(0);
    onRosterUpdated?.();
  };

  const handleAppendPasted = () => {
    const names = parsePastedNames(pastedText);
    if (names.length === 0) {
      setStatusMessage({ type: 'error', text: '請輸入有效的學生姓名' });
      return;
    }
    const existingNames = new Set(students.map((s) => s.name));
    const toAdd = names.filter((n) => !existingNames.has(n));
    if (toAdd.length === 0) {
      setStatusMessage({ type: 'error', text: '這些學生已在名單中，未重複新增' });
      return;
    }
    const appended = [...students, ...namesToStudents(toAdd)];
    // Re-index numbers
    const renumbered = appended.map((s, idx) => ({ ...s, number: idx + 1 }));
    setStudents(renumbered);
    soundEffects.playShuffle();
    setStatusMessage({ type: 'success', text: `成功追加 ${toAdd.length} 位新學生！` });
    setPastedText('');
    setPastePreviewCount(0);
    onRosterUpdated?.();
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const parsed = parseCSVContent(text);
      if (parsed.length === 0) {
        setStatusMessage({ type: 'error', text: '無法從檔案中解析出學生姓名，請確認格式' });
        return;
      }
      setStudents(namesToStudents(parsed));
      soundEffects.playShuffle();
      setStatusMessage({ type: 'success', text: `成功從「${file.name}」匯入 ${parsed.length} 位學生！` });
      onRosterUpdated?.();
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: '讀取檔案失敗，請重試' });
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStudentName.trim();
    if (!trimmed) return;
    const newStudent: Student = {
      id: `stu_${Date.now()}`,
      name: trimmed,
      number: students.length + 1,
    };
    setStudents([...students, newStudent]);
    setNewStudentName('');
    soundEffects.playTick(1.1);
    onRosterUpdated?.();
  };

  const handleRemoveStudent = (id: string) => {
    const filtered = students.filter((s) => s.id !== id);
    const renumbered = filtered.map((s, idx) => ({ ...s, number: idx + 1 }));
    setStudents(renumbered);
    soundEffects.playReset();
    onRosterUpdated?.();
  };

  const handleLoadSample = () => {
    setStudents(namesToStudents(SAMPLE_STUDENTS));
    soundEffects.playShuffle();
    setStatusMessage({ type: 'success', text: `已載入三年二班範例名單（共 ${SAMPLE_STUDENTS.length} 人）` });
    onRosterUpdated?.();
  };

  const handleClearAll = () => {
    if (window.confirm('確定要清空目前所有的學生名單嗎？')) {
      setStudents([]);
      soundEffects.playReset();
      setStatusMessage({ type: 'success', text: '名單已清空' });
      onRosterUpdated?.();
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const header = '座號,姓名\n';
    const rows = students.map((s) => `${s.number || ''},${s.name}`).join('\n');
    downloadFile(`學生名單_${new Date().toISOString().slice(0, 10)}.csv`, header + rows);
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.number && s.number.toString().includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            學生名單設定
            <span className="text-sm font-normal text-slate-500">
              (目前共 <strong className="text-indigo-600 font-semibold">{students.length}</strong> 位學生)
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            上傳 CSV 表格檔案或直接貼上姓名，系統會自動轉換為點名抽籤與分組池。
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-load-sample"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200/60 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>載入示範名單 (28人)</span>
          </button>

          {students.length > 0 && (
            <>
              <button
                id="btn-export-csv"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>匯出 CSV</span>
              </button>

              <button
                id="btn-clear-roster"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>清空</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-sm animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs text-slate-500 hover:text-slate-800 ml-4 font-semibold"
          >
            關閉
          </button>
        </div>
      )}

      {/* Main Grid: Input Column & List Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input source (Paste or CSV) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            {/* Tabs for Paste / CSV */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <button
                id="tab-paste-input"
                onClick={() => setActiveInputMode('paste')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeInputMode === 'paste'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>貼上學生名單</span>
              </button>
              <button
                id="tab-upload-input"
                onClick={() => setActiveInputMode('upload')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeInputMode === 'upload'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>上傳 CSV / 檔案</span>
              </button>
            </div>

            {activeInputMode === 'paste' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    支援一行一個名字、逗號、空格，或含有座號格式（如：1. 王小明）
                  </span>
                  {pastePreviewCount > 0 && (
                    <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      偵測到 {pastePreviewCount} 個姓名
                    </span>
                  )}
                </div>

                <textarea
                  id="textarea-student-names"
                  value={pastedText}
                  onChange={handleTextChange}
                  rows={8}
                  placeholder={`請直接在此貼上姓名，例如：\n陳冠廷\n林子軒\n黃柏翰\n張宇翔\n李承翰\n...`}
                  className="w-full p-3.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    id="btn-apply-pasted"
                    onClick={handleApplyPasted}
                    disabled={!pastedText.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
                  >
                    替換為此名單 ({pastePreviewCount} 人)
                  </button>
                  {students.length > 0 && (
                    <button
                      id="btn-append-pasted"
                      onClick={handleAppendPasted}
                      disabled={!pastedText.trim()}
                      className="py-2.5 px-3.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                      title="保留現有名單並將新名單追加至末尾"
                    >
                      追加名單
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .txt, text/plain, text/csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    點擊或拖曳 CSV / TXT 檔案至此
                  </p>
                  <p className="text-xs text-slate-500 mt-1">支援 UTF-8 編碼之逗點或換行檔案</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-700">CSV 格式建議範例：</p>
                  <code className="block bg-white p-2 rounded border border-slate-200 text-slate-600">
                    座號,姓名<br />
                    1,陳冠廷<br />
                    2,林子軒
                  </code>
                  <p className="text-slate-500 pt-1">
                    若無標題列，系統會自動抓取第 1 欄或第 2 欄的學生姓名。
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick single student add */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <form onSubmit={handleAddSingleStudent} className="flex gap-2">
              <input
                id="input-single-student"
                type="text"
                placeholder="手動新增一位學生姓名..."
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                id="btn-add-single-student"
                type="submit"
                disabled={!newStudentName.trim()}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>新增</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Current Roster Display */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900">目前學生清單</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                  {filteredStudents.length} / {students.length}
                </span>
              </div>

              {/* Search */}
              <div className="relative w-40 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜尋姓名或座號..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* List */}
            {students.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-400 text-sm font-medium">尚未匯入任何學生名單</p>
                <p className="text-slate-400 text-xs mt-1">請在左側貼上名單，或點擊上方「載入示範名單」體驗</p>
                <button
                  onClick={handleLoadSample}
                  className="mt-4 px-4 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  載入示範名單
                </button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                找不到符合「{searchQuery}」的學生
              </div>
            ) : (
              <div className="max-h-[460px] overflow-y-auto pr-1 divide-y divide-slate-100 border border-slate-100 rounded-xl">
                {filteredStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-50/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-mono font-semibold flex items-center justify-center">
                        {student.number || index + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">{student.name}</span>
                    </div>

                    <button
                      id={`btn-remove-student-${student.id}`}
                      onClick={() => handleRemoveStudent(student.id)}
                      title={`刪除 ${student.name}`}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
