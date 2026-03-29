import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import '../style.css';
import { Layout } from '../components/Layout';
import { Header } from '../components/Header';
import { storage } from '../services/storage';

const Popup = () => {
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [currentSite, setCurrentSite] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [pausedUntil, setPausedUntil] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    storage.get(['global_enabled', 'paused_until']).then((result) => {
       setGlobalEnabled(result.global_enabled !== false);
       const pu = result.paused_until || 0;
       setPausedUntil(pu);
       setRemainingMs(Math.max(0, pu - Date.now()));
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        try {
          const hostname = new URL(tabs[0].url).hostname;
          setCurrentSite(hostname);
        } catch(e) {}
      }
    });

    fetchLogs();
  }, []);

  const fetchLogs = () => {
      storage.get(['logs']).then((result) => {
          setLogs(result.logs || []);
      });
  };

  useEffect(() => {
    if (pausedUntil <= 0) return;
    setRemainingMs(Math.max(0, pausedUntil - Date.now()));
    const interval = setInterval(() => {
      const ms = Math.max(0, pausedUntil - Date.now());
      setRemainingMs(ms);
      if (ms === 0) setPausedUntil(0);
    }, 1000);
    return () => clearInterval(interval);
  }, [pausedUntil]);

  useEffect(() => {
      if (!currentSite) return;
      
      storage.get(['blacklist']).then((result) => {
          const blacklist = result.blacklist || [];
          const stored = blacklist.some((site: string) => currentSite.includes(site));
          setIsBlocked(stored);
      });
  }, [currentSite]);

  const toggleGlobal = () => {
    const newState = !globalEnabled;
    setGlobalEnabled(newState);
    storage.set({ global_enabled: newState });
    if (!newState) {
        chrome.action.setBadgeText({ text: 'OFF' });
        chrome.action.setBadgeBackgroundColor({ color: '#666666' });
    } else {
        chrome.action.setBadgeText({ text: 'ON' });
        chrome.action.setBadgeBackgroundColor({ color: '#f58e0a' });
    }
  };

  const toggleBlacklist = () => {
    if (!currentSite) return;

    storage.get(['blacklist']).then((result) => {
      let currentBlacklist = result.blacklist || [];
      let newBlacklist;
      let adding = false;
      
      if (isBlocked) {
          newBlacklist = currentBlacklist.filter((site: string) => !currentSite.includes(site));
          setStatusMsg('Unblocked!');
      } else {
          const siteToAdd = currentSite.replace(/^www\./, '');
          if (!currentBlacklist.includes(siteToAdd)) {
              newBlacklist = [...currentBlacklist, siteToAdd];
              setStatusMsg('Blocked!');
              adding = true;
          } else {
              newBlacklist = currentBlacklist; 
          }
      }

      if (newBlacklist) {
        storage.set({ blacklist: newBlacklist }).then(() => {
            setIsBlocked(!isBlocked);
            if (adding) {
                chrome.tabs.reload();
            }
            setTimeout(() => setStatusMsg(''), 2000);
        });
      }
    });
  };

  const pauseFor = (minutes: number) => {
    const until = Date.now() + minutes * 60 * 1000;
    storage.set({ paused_until: until });
    setPausedUntil(until);
    setRemainingMs(minutes * 60 * 1000);
  };

  const resumePause = () => {
    storage.set({ paused_until: 0 });
    setPausedUntil(0);
    setRemainingMs(0);
  };

  const isPausedNow = remainingMs > 0;
  const StatusIndicator = () => {
    if (!globalEnabled) return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-red-500"></div>
        <span className="text-xs text-gray-400">Disabled</span>
      </div>
    );
    if (isPausedNow) return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
        <span className="text-xs text-gray-400">Paused</span>
      </div>
    );
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-xs text-gray-400">Monitoring...</span>
      </div>
    );
  };

  if (showLogs) {
      return (
        <Layout className="w-80 h-[400px] flex flex-col">
           <div className="bg-[#4a3b32] p-2 flex items-center justify-between border-b border-[#5d4a3f]">
             <h2 className="font-bold text-[#f58e0a]">Activity Log</h2>
             <button onClick={() => setShowLogs(false)} className="text-gray-400 hover:text-white">✕</button>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
               {logs.length === 0 ? (
                   <div className="text-gray-500 italic">No activity yet.</div>
               ) : (
                   logs.map((log, i) => <div key={i} className="border-b border-[#333] pb-1 mb-1 last:border-0">{log}</div>)
               )}
           </div>
           <div className="p-2 border-t border-[#444]">
               <button onClick={() => {
                   storage.set({ logs: [] });
                   setLogs([]);
               }} className="w-full bg-[#444] hover:bg-[#555] text-white py-1 rounded">Clear Logs</button>
           </div>
        </Layout>
      );
  }

  return (
    <Layout className="w-80 pb-1">
      <Header title="DuckTator" statusIndicator={<StatusIndicator />} />

      {statusMsg && (
          <div className="bg-[#363636] p-2 text-center text-[#f58e0a] font-bold text-xs border-b border-[#444] animate-pulse">
              {statusMsg}
          </div>
      )}

      <div className="divide-y divide-[#3d3d3d] mb-1">
        <div 
          onClick={globalEnabled ? toggleBlacklist : undefined}
          className={`p-3 transition-colors flex items-center justify-between ${globalEnabled ? 'hover:bg-[#363636] cursor-pointer group' : 'opacity-50 cursor-not-allowed'}`}
        >
            <div className="flex flex-col">
                <span className="font-medium group-hover:text-white">
                    { !globalEnabled ? 'Enable to manage sites' : (isBlocked ? 'Unblock this site' : 'Block this site') }
                </span>
                <span className="text-[10px] text-gray-500 truncate w-40">{currentSite}</span>
            </div>
            <span className={`text-lg ${isBlocked && globalEnabled ? 'text-red-500' : 'text-gray-500'} ${globalEnabled ? 'group-hover:text-green-400' : ''}`}>
                {globalEnabled ? (isBlocked ? '⛔' : '➕') : '🔒'}
            </span>
        </div>

         <div 
          onClick={toggleGlobal}
          className="p-3 hover:bg-[#363636] transition-colors cursor-pointer group flex items-center justify-between"
         >
            <span className="font-medium group-hover:text-white">
              {globalEnabled ? 'Disable Extension' : 'Enable Extension'}
            </span>
             <span className="text-gray-500 group-hover:text-[#f58e0a] text-lg">
               {globalEnabled ? '🛑' : '🟢'}
             </span>
        </div>
      </div>

      {isPausedNow ? (
        <div className="p-3 bg-[#2b2a2a] border-t border-[#3d3d3d] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider">Paused</span>
            <span className="font-mono text-sm text-gray-300">
              {Math.floor(remainingMs / 60000)}m {Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, '0')}s remaining
            </span>
          </div>
          <button
            onClick={resumePause}
            className="text-xs bg-[#444] hover:bg-[#555] text-white px-3 py-1.5 rounded border border-[#555] transition-colors"
          >
            Resume
          </button>
        </div>
      ) : (
        <div className="p-3 border-t border-[#3d3d3d] flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Pause for:</span>
          <div className="flex gap-1">
            {[15, 30, 60].map(m => (
              <button
                key={m}
                onClick={() => pauseFor(m)}
                disabled={!globalEnabled}
                className="text-xs bg-[#363636] hover:bg-[#444] disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 px-2 py-1 rounded border border-[#555] transition-colors"
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#f58e0a] grid grid-cols-2 gap-[1px]">
        <button 
           onClick={() => chrome.runtime.openOptionsPage()}
           className="bg-[#f58e0a] hover:bg-[#d47b09] text-white font-bold py-2 px-4 text-center transition-colors border-r border-[#d47b09]"
        >
          Options
        </button>
        <button 
           onClick={() => { fetchLogs(); setShowLogs(true); }}
           className="bg-[#f58e0a] hover:bg-[#d47b09] text-white font-bold py-2 px-4 text-center transition-colors"
        >
           Log
        </button>
      </div>
    </Layout>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Popup />);
