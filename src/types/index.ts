export interface Schedule {
  enabled: boolean;
  days: number[]; 
  startTime: string;
  endTime: string;
}

export interface AppStorage {
  blacklist: string[];
  global_enabled: boolean;
  logs: string[];
  schedule: Schedule;
  paused_until: number;
  sound_enabled: boolean;
}

export interface RoastMessage {
  action: 'ROAST_THE_USER';
  url: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
}
