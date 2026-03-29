import { storage } from '../services/storage';
import { isBlacklisted, getHostname } from '../utils/domain';
import { ROAST_DELAY_MINUTES } from '../utils/constants';

const ALARM_PREFIX = 'roast_';

const logEvent = (message: string) => {
  storage.log(message);
};

const updateBadge = (enabled: boolean) => {
    if (enabled) {
        chrome.action.setBadgeText({ text: 'ON' });
        chrome.action.setBadgeBackgroundColor({ color: '#f58e0a' });
    } else {
        chrome.action.setBadgeText({ text: 'OFF' });
        chrome.action.setBadgeBackgroundColor({ color: '#666666' });
    }
};

const scheduleRoast = (tabId: number) => {
    chrome.alarms.clear(`${ALARM_PREFIX}${tabId}`);
    chrome.alarms.create(`${ALARM_PREFIX}${tabId}`, { delayInMinutes: ROAST_DELAY_MINUTES });
};

chrome.runtime.onInstalled.addListener(() => {
  storage.get(['blacklist', 'global_enabled']).then((result) => {
      if (!result.blacklist) {
        storage.set({ blacklist: [] });
      }
      if (result.global_enabled === undefined) {
          storage.set({ global_enabled: true });
          updateBadge(true);
      } else {
          updateBadge(result.global_enabled);
      }
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.global_enabled) {
        const newValue = changes.global_enabled.newValue;
        updateBadge(newValue);
        if (!newValue) {
            chrome.alarms.clearAll();
            logEvent('Global disabled - cleared alarms');
        } else {
            logEvent('Global enabled - re-checking tabs');
            chrome.tabs.query({}, (tabs) => {
                storage.get(['blacklist']).then((result) => {
                    const blacklist = result.blacklist || [];
                    tabs.forEach(tab => {
                        if (tab.url && tab.id && isBlacklisted(tab.url, blacklist)) {
                             scheduleRoast(tab.id);
                             logEvent(`Re-scheduling roast for tab ${tab.id}`);
                        }
                    });
                });
            });
        }
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    storage.get(['blacklist', 'global_enabled']).then((result) => {
      const globalEnabled = result.global_enabled !== false; 
      const blacklist = result.blacklist || [];

      if (!globalEnabled) return;

      if (isBlacklisted(tab.url!, blacklist)) {
        logEvent(`Monitoring ${getHostname(tab.url!)}`);
        scheduleRoast(tabId);
      }
    });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith(ALARM_PREFIX)) {
    const tabId = parseInt(alarm.name.split('_')[1]);
    
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab || !tab.url) return;
      
      storage.get(['global_enabled']).then((result) => {
          if (result.global_enabled === false) return;

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
