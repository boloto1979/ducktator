import { AppStorage } from '../types';

export const storage = {
  get: <K extends keyof AppStorage>(keys: K[]): Promise<Pick<AppStorage, K>> => {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        resolve(result as Pick<AppStorage, K>);
      });
    });
  },

  set: (data: Partial<AppStorage>): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => resolve());
    });
  },

  log: async (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${message}`;
    
    chrome.storage.local.get(['logs'], (result) => {
      const logs = result.logs || [];
      const newLogs = [entry, ...logs].slice(0, 50);
      chrome.storage.local.set({ logs: newLogs });
    });
  }
};
