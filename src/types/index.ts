export interface AppStorage {
  blacklist: string[];
  global_enabled: boolean;
  logs: string[];
}

export interface RoastMessage {
  action: 'ROAST_THE_USER';
  url: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
}
