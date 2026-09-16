import { Student } from '../types';

export const SAMPLE_STUDENTS = [
  '陳冠廷', '林子軒', '黃柏翰', '張宇翔', '李承翰',
  '王品翔', '吳冠佑', '劉定緯', '蔡宗翰', '楊承恩',
  '許家豪', '鄭凱文', '謝秉宏', '郭俊傑', '洪晨恩',
  '陳詠晴', '林宜蓁', '黃語桐', '張羽希', '李品妍',
  '王若涵', '吳若瑄', '劉思婷', '蔡心凌', '楊宛蓁',
  '許婷涵', '鄭芷萱', '謝宥琳'
];

/**
 * Parses raw text input into cleaned student list.
 * Can handle newlines, commas, Chinese commas (，), tabs, spaces, numbered lines (1. 王小明, 1、李小花).
 */
export function parsePastedNames(text: string): string[] {
  if (!text.trim()) return [];

  // Replace common delimiters with newlines
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[,，;；\t]/g, '\n');

  const lines = normalized.split('\n');
  const results: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Strip leading numbers or bullets like "1. ", "02、", "[1] ", "1 - "
    line = line.replace(/^(\d+[\.、\-\s\]\)]+|[•\*\-]\s*)/, '').trim();

    // Strip quotes
    line = line.replace(/^["']|["']$/g, '').trim();

    if (line.length > 0 && !isHeaderRow(line)) {
      results.push(line);
    }
  }

  // Remove duplicates or keep distinct? Usually we keep all parsed lines or deduplicate exact empty lines
  return results;
}

/**
 * Checks if a line resembles a table header (e.g. "姓名", "學生", "Name", etc.)
 */
function isHeaderRow(str: string): boolean {
  const lower = str.toLowerCase();
  const headers = ['姓名', '學生姓名', '學生', 'name', 'student name', 'student', '座號', '學號', 'id'];
  return headers.includes(lower);
}

/**
 * Parses standard CSV content
 */
export function parseCSVContent(csvText: string): string[] {
  if (!csvText.trim()) return [];

  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const parsedNames: string[] = [];

  // Inspect first line to find which column is likely the Name
  const firstLineCols = splitCSVLine(lines[0]);
  let nameColIndex = 0;

  const foundIndex = firstLineCols.findIndex(c => {
    const col = c.trim().toLowerCase();
    return col === '姓名' || col === '學生姓名' || col === 'name' || col === 'student' || col.includes('名');
  });

  let startIndex = 0;
  if (foundIndex !== -1) {
    nameColIndex = foundIndex;
    startIndex = 1; // skip header row
  } else {
    // If first row has multiple columns, check if 2nd col is name (e.g. [座號, 姓名])
    if (firstLineCols.length > 1 && !isNaN(Number(firstLineCols[0].trim()))) {
      nameColIndex = 1;
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length > nameColIndex) {
      const val = cols[nameColIndex].replace(/^["']|["']$/g, '').trim();
      if (val && !isHeaderRow(val)) {
        parsedNames.push(val);
      }
    } else if (cols.length > 0) {
      const val = cols[0].replace(/^["']|["']$/g, '').trim();
      if (val && !isHeaderRow(val)) {
        parsedNames.push(val);
      }
    }
  }

  return parsedNames;
}

/**
 * Robust CSV line splitter respecting quotes
 */
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Downloads a file to client
 */
export function downloadFile(filename: string, content: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType }); // \uFEFF BOM for Excel Chinese UTF-8 support
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates unique ID
 */
export function createId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Convert names list to Student array
 */
export function namesToStudents(names: string[]): Student[] {
  return names.map((name, idx) => ({
    id: `stu_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    number: idx + 1
  }));
}
