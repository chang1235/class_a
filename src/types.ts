export interface Student {
  id: string;
  name: string;
  number?: number;
}

export interface DrawRecord {
  id: string;
  studentName: string;
  timestamp: number;
  order: number;
}

export type ActiveTab = 'picker' | 'grouping' | 'roster';

export interface GroupConfig {
  mode: 'bySize' | 'byCount';
  groupSize: number;
  groupCount: number;
  remainderStrategy: 'distribute' | 'newGroup';
  pickLeader: boolean;
}

export interface StudentGroup {
  id: string;
  groupNumber: number;
  name: string;
  color: {
    badge: string;
    border: string;
    bg: string;
    headerBg: string;
    text: string;
  };
  members: string[];
  leader?: string;
}
