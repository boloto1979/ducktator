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

  useEffect(() => {
    storage.get(['global_enabled']).then((result) => {
       setGlobalEnabled(result.global_enabled !== false);
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

  const StatusIndicator = () => (
      <div className="flex items-center gap-1">
         <div className={`w-2 h-2 rounded-full ${globalEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
         <span className="text-xs text-gray-400">{globalEnabled ? 'Monitoring...' : 'Disabled'}</span>
      </div>
  );

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
