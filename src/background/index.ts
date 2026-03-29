import { storage } from '../services/storage';
import { isBlacklisted, getHostname } from '../utils/domain';
import { ROAST_DELAY_MINUTES, DEFAULT_SCHEDULE } from '../utils/constants';
import { Schedule } from '../types';

const ALARM_PREFIX = 'roast_';
const PAUSE_ALARM = 'pause_resume';

const logEvent = (message: string) => {
  storage.log(message);
};

const updateBadge = (enabled: boolean) => {
    chrome.action.setBadgeText({ text: enabled ? 'ON' : 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: enabled ? '#f58e0a' : '#666666' });
};

const scheduleRoast = (tabId: number) => {
    chrome.alarms.clear(`${ALARM_PREFIX}${tabId}`);
    chrome.alarms.create(`${ALARM_PREFIX}${tabId}`, { delayInMinutes: ROAST_DELAY_MINUTES });
};

const isWithinSchedule = (schedule: Schedule): boolean => {
    if (!schedule.enabled) return true;
    const now = new Date();
    const day = now.getDay();
    if (!schedule.days.includes(day)) return false;
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

const isPaused = (pausedUntil: number): boolean => pausedUntil > Date.now();

const resumeMonitoring = () => {
    chrome.tabs.query({}, (tabs) => {
        storage.get(['blacklist', 'schedule', 'paused_until']).then((result) => {
            const blacklist = result.blacklist || [];
            const schedule = result.schedule || DEFAULT_SCHEDULE;
            if (isPaused(result.paused_until || 0)) return;
            if (!isWithinSchedule(schedule)) return;
            tabs.forEach(tab => {
                if (tab.url && tab.id && isBlacklisted(tab.url, blacklist)) {
                    scheduleRoast(tab.id);
                    logEvent(`Re-scheduling roast for tab ${tab.id}`);
                }
            });
        });
    });
};

chrome.runtime.onInstalled.addListener(() => {
  storage.get(['blacklist', 'global_enabled', 'schedule', 'paused_until', 'sound_enabled']).then((result) => {
      if (!result.blacklist) storage.set({ blacklist: [] });
      if (result.global_enabled === undefined) storage.set({ global_enabled: true });
      if (!result.schedule) storage.set({ schedule: DEFAULT_SCHEDULE });
      if (result.paused_until === undefined) storage.set({ paused_until: 0 });
      if (result.sound_enabled === undefined) storage.set({ sound_enabled: true });
      updateBadge(result.global_enabled !== false);
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;

    if (changes.global_enabled) {
        const newValue = changes.global_enabled.newValue as boolean;
        updateBadge(newValue);
        if (!newValue) {
            chrome.alarms.clearAll();
            logEvent('Global disabled - cleared alarms');
        } else {
            logEvent('Global enabled - re-checking tabs');
            resumeMonitoring();
        }
    }

    if (changes.paused_until) {
        const newValue = changes.paused_until.newValue as number;
        if (newValue > Date.now()) {
            chrome.alarms.getAll((alarms) => {
                alarms
                    .filter(a => a.name.startsWith(ALARM_PREFIX))
                    .forEach(a => chrome.alarms.clear(a.name));
            });
            chrome.alarms.clear(PAUSE_ALARM);
            chrome.alarms.create(PAUSE_ALARM, { when: newValue });
            logEvent(`Paused until ${new Date(newValue).toLocaleTimeString()}`);
        } else {
            chrome.alarms.clear(PAUSE_ALARM);
            storage.get(['global_enabled']).then((result) => {
                if (result.global_enabled !== false) {
                    resumeMonitoring();
                    logEvent('Pause ended - resuming monitoring');
                }
            });
        }
    }

    if (changes.schedule) {
        storage.get(['global_enabled', 'paused_until']).then((result) => {
            if (result.global_enabled === false) return;
            if (isPaused(result.paused_until || 0)) return;
            if (isWithinSchedule(changes.schedule.newValue as Schedule)) {
                resumeMonitoring();
            } else {
                chrome.alarms.getAll((alarms) => {
                    alarms
                        .filter(a => a.name.startsWith(ALARM_PREFIX))
                        .forEach(a => chrome.alarms.clear(a.name));
                });
                logEvent('Outside schedule - cleared alarms');
            }
        });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    storage.get(['blacklist', 'global_enabled', 'schedule', 'paused_until']).then((result) => {
      if (result.global_enabled === false) return;
      if (isPaused(result.paused_until || 0)) return;
      if (!isWithinSchedule(result.schedule || DEFAULT_SCHEDULE)) return;
      const blacklist = result.blacklist || [];
      if (isBlacklisted(tab.url!, blacklist)) {
        logEvent(`Monitoring ${getHostname(tab.url!)}`);
        scheduleRoast(tabId);
      }
    });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === PAUSE_ALARM) {
    storage.set({ paused_until: 0 });
    return;
  }

  if (alarm.name.startsWith(ALARM_PREFIX)) {
    const tabId = parseInt(alarm.name.split('_')[1]);

    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab || !tab.url) return;

      storage.get(['global_enabled', 'schedule', 'paused_until']).then((result) => {
          if (result.global_enabled === false) return;
          if (isPaused(result.paused_until || 0)) return;
          if (!isWithinSchedule(result.schedule || DEFAULT_SCHEDULE)) return;

          const host = getHostname(tab.url!);
          logEvent(`Roasting tab ${tabId}: ${host}`);

          chrome.tabs.sendMessage(tabId, {
            action: 'ROAST_THE_USER',
            url: tab.url
          })
          .then(() => {
             logEvent(`Roast command sent to tab ${tabId} successfully`);
          })
          .catch(() => {
              logEvent(`Failed to roast tab ${tabId} (content script disconnected/missing).`);
          });
      });
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.alarms.clear(`${ALARM_PREFIX}${tabId}`);
});
