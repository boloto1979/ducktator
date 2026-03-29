import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import '../style.css';
import { Layout } from '../components/Layout';
import { Header } from '../components/Header';
import { storage } from '../services/storage';
import { Schedule } from '../types';
import { DEFAULT_SCHEDULE } from '../utils/constants';

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

const Options = () => {
  const [newSite, setNewSite] = useState('');
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    storage.get(['blacklist', 'schedule', 'sound_enabled']).then((result) => {
      if (result.blacklist) setBlacklist(result.blacklist);
      if (result.schedule) setSchedule(result.schedule);
      setSoundEnabled(result.sound_enabled !== false);
    });
  }, []);

  const saveBlacklist = (newList: string[]) => {
    storage.set({ blacklist: newList }).then(() => {
      setStatus('Saved!');
      setTimeout(() => setStatus(''), 2000);
    });
  };

  const updateSchedule = (partial: Partial<Schedule>) => {
    const updated = { ...schedule, ...partial };
    setSchedule(updated);
    storage.set({ schedule: updated }).then(() => {
      setStatus('Saved!');
      setTimeout(() => setStatus(''), 2000);
    });
  };

  const toggleDay = (day: number) => {
    const days = schedule.days.includes(day)
      ? schedule.days.filter(d => d !== day)
      : [...schedule.days, day].sort((a, b) => a - b);
    updateSchedule({ days });
  };

  const toggleSound = () => {
    const updated = !soundEnabled;
    setSoundEnabled(updated);
    storage.set({ sound_enabled: updated }).then(() => {
      setStatus('Saved!');
      setTimeout(() => setStatus(''), 2000);
    });
  };

  const addSite = () => {
    if (!newSite) return;
    
    let siteToAdd = newSite.trim().toLowerCase();
    siteToAdd = siteToAdd.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    if (blacklist.includes(siteToAdd)) {
      setStatus('Site already in blacklist!');
      setTimeout(() => setStatus(''), 2000);
      return;
    }

    const updatedList = [...blacklist, siteToAdd];
    setBlacklist(updatedList);
    saveBlacklist(updatedList);
    setNewSite('');
  };

  const removeSite = (siteToRemove: string) => {
    const updatedList = blacklist.filter(site => site !== siteToRemove);
    setBlacklist(updatedList);
    saveBlacklist(updatedList);
  };

  return (
    <Layout className="min-h-screen">
       <Header title="DuckTator" subtitle="Configuration Panel" 
               statusIndicator={<span className="text-xs text-gray-400">v1.0.0</span>} />
        
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-[#363636] p-4 rounded border border-[#444] h-fit">
            <h3 className="font-bold text-[#f58e0a] mb-2 uppercase text-xs tracking-wider">Instructions</h3>
            <p className="text-gray-400 mb-4 text-xs leading-relaxed">
              Add domains you want to be roasted about. The extension will monitor time spent on these sites and deploy the Duck when you exceed the limit.
            </p>
            <div className="bg-[#2a2a2a] p-3 rounded border border-[#444]">
               <h4 className="font-bold text-gray-300 text-xs mb-1">Current Mode</h4>
               <span className="text-[#f58e0a] text-xs font-mono">AGGRESSIVE ROASTING</span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            
            <div className="bg-[#363636] p-4 rounded border border-[#444]">
               <h2 className="font-bold text-white mb-3">Add Pattern</h2>
               <div className="flex gap-0">
                <input
                  className="bg-[#2b2a2a] border border-[#555] text-gray-200 text-sm rounded-l px-3 py-2 w-full focus:outline-none focus:border-[#f58e0a] focus:ring-1 focus:ring-[#f58e0a]"
                  type="text"
                  placeholder="e.g. twitter.com"
                  value={newSite}
                  onChange={(e) => setNewSite(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSite()}
                />
                <button
                  className="bg-[#757575] hover:bg-[#888] text-white font-bold py-2 px-4 rounded-r text-sm border-l border-[#555] transition-colors"
                  onClick={addSite}
                >
                  Add
                </button>
              </div>
               {status && (
                <div className="mt-2 text-xs font-bold text-[#f58e0a]">
                  {status}
                </div>
              )}
            </div>

             <div className="bg-[#363636] rounded border border-[#444] overflow-hidden">
                <div className="bg-[#444] px-4 py-2 flex justify-between items-center">
                   <h3 className="font-bold text-gray-200 text-xs uppercase">Blacklisted Domains</h3>
                   <span className="bg-[#f58e0a] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{blacklist.length}</span>
                </div>
                
                <div className="divide-y divide-[#444] max-h-[400px] overflow-y-auto">
                  {blacklist.length > 0 ? (
                    blacklist.map((site) => (
                      <div key={site} className="group p-3 flex justify-between items-center hover:bg-[#2a2a2a] transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[#f58e0a] text-xs font-bold">PROHIBITED</span>
                          <span className="text-gray-300 font-mono text-sm">{site}</span>
                        </div>
                        <button
                          className="text-gray-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-black/20 transition-colors"
                          onClick={() => removeSite(site)}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-sm italic">
                      No patterns defined. You are safe... for now.
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>

        <div className="mt-6 bg-[#363636] p-4 rounded border border-[#444]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white">Quack Sound</h2>
              <p className="text-xs text-gray-500 mt-0.5">Play a quack when the duck appears</p>
            </div>
            <div
              onClick={toggleSound}
              className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${soundEnabled ? 'bg-[#f58e0a]' : 'bg-[#555]'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>
        </div>

        <div className="mt-6 bg-[#363636] p-4 rounded border border-[#444]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-white">Active Schedule</h2>
              <p className="text-xs text-gray-500 mt-0.5">Restrict monitoring to specific days and hours</p>
            </div>
            <div
              onClick={() => updateSchedule({ enabled: !schedule.enabled })}
              className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${schedule.enabled ? 'bg-[#f58e0a]' : 'bg-[#555]'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${schedule.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>

          <div className={`space-y-4 transition-opacity ${!schedule.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Active Days</p>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => toggleDay(value)}
                    className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                      schedule.days.includes(value)
                        ? 'bg-[#f58e0a] border-[#f58e0a] text-white'
                        : 'bg-transparent border-[#555] text-gray-400 hover:border-[#f58e0a] hover:text-[#f58e0a]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Start Time</p>
                <input
                  type="time"
                  value={schedule.startTime}
                  onChange={(e) => updateSchedule({ startTime: e.target.value })}
                  className="bg-[#2b2a2a] border border-[#555] text-gray-200 text-sm rounded px-3 py-2 w-full focus:outline-none focus:border-[#f58e0a] focus:ring-1 focus:ring-[#f58e0a]"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">End Time</p>
                <input
                  type="time"
                  value={schedule.endTime}
                  onChange={(e) => updateSchedule({ endTime: e.target.value })}
                  className="bg-[#2b2a2a] border border-[#555] text-gray-200 text-sm rounded px-3 py-2 w-full focus:outline-none focus:border-[#f58e0a] focus:ring-1 focus:ring-[#f58e0a]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Options />);
