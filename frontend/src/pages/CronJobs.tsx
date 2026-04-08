import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Play, Pause, RotateCcw, Clock, Trash2, Plus, Eye, Zap, Search } from 'lucide-react';
import axios from 'axios';

interface LiveJob {
  id: string;
  command: string;
  interval_minutes: number;
  created_at: number;
  next_run_time: string | null;
  status: string;
}

interface LiveWatchdog {
  id: string;
  directory: string;
  action: string;
  status: string;
}

export default function CronJobs() {
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [watchdogs, setWatchdogs] = useState<LiveWatchdog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [cronRes, watchRes] = await Promise.all([
         axios.get('http://localhost:8000/api/cron'),
         axios.get('http://localhost:8000/api/watchdog')
      ]);
      setJobs(cronRes.data.jobs);
      setWatchdogs(watchRes.data.watchdogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const deleteJob = async (id: string, isWatchdog: boolean) => {
    try {
       if (isWatchdog) {
         await axios.delete(`http://localhost:8000/api/watchdog/${id}`);
       } else {
         await axios.delete(`http://localhost:8000/api/cron/${id}`);
       }
       fetchData();
    } catch (e) {
       console.error("Failed to delete daemon", e);
    }
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto w-full custom-scrollbar bg-transparent text-neutral-900 dark:text-neutral-200">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
           <div>
             <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand-hover text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
                  <Zap size={24} />
                </div>
                <h2 className="text-3xl font-semibold text-neutral-900 dark:text-white">Daemon Core</h2>
             </div>
             <p className="text-neutral-500 dark:text-neutral-400">Monitor active background crons and file system watchdogs proactively analyzing your OS.</p>
           </div>
        </div>

        {loading ? (
             <div className="flex items-center justify-center py-20">
                <RotateCcw size={32} className="animate-spin text-brand" />
             </div>
        ) : (
            <>
               <div className="mb-10">
                   <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b border-neutral-200 dark:border-border pb-2"><CalendarClock size={20} className="text-brand"/> Autonomous Schedules</h3>
                   {jobs.length === 0 ? (
                       <div className="p-8 text-center text-neutral-500 border border-dashed border-neutral-200 dark:border-border rounded-2xl">No background crons active. Use the Agent to schedule tasks natively.</div>
                   ) : (
                      <div className="grid gap-4">
                        <AnimatePresence>
                        {jobs.map((job, i) => (
                          <motion.div 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, scale: 0.95 }}
                             key={job.id}
                             className="bg-white/80 dark:bg-surface/80 backdrop-blur-md border border-neutral-200 dark:border-border p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-brand/50 transition-colors"
                          >
                            <div className="flex items-center gap-5 flex-1 min-w-0 pr-4">
                              <div className={`p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shadow-inner`}>
                                  <RotateCcw size={20} className="animate-spin-slow" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                 <h3 className="text-base font-medium text-neutral-900 dark:text-white mb-1.5 flex items-center gap-2 truncate">
                                    <span className="truncate">{job.command}</span>
                                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-md uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-500`}>
                                       {job.status}
                                    </span>
                                 </h3>
                                 <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono">
                                    <span className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-md border border-neutral-200 dark:border-border"><Clock size={12} /> Every {job.interval_minutes}m</span>
                                    {job.next_run_time && <span className="text-brand flex items-center gap-1"><Play size={10} className="fill-brand"/> Next: {new Date(job.next_run_time).toLocaleTimeString()}</span>}
                                 </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                               <button onClick={() => deleteJob(job.id, false)} className="p-2.5 bg-neutral-100 dark:bg-neutral-900 hover:bg-rose-500/20 text-neutral-600 dark:hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-500/30">
                                  <Trash2 size={18} />
                               </button>
                            </div>
                          </motion.div>
                        ))}
                        </AnimatePresence>
                      </div>
                   )}
               </div>

               <div>
                   <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b border-neutral-200 dark:border-border pb-2"><Eye size={20} className="text-indigo-500"/> System Watchdogs</h3>
                   {watchdogs.length === 0 ? (
                       <div className="p-8 text-center text-neutral-500 border border-dashed border-neutral-200 dark:border-border rounded-2xl">No Watchdogs active. Instruct the agent to monitor a folder natively.</div>
                   ) : (
                      <div className="grid gap-4">
                        <AnimatePresence>
                        {watchdogs.map((watch, i) => (
                          <motion.div 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, scale: 0.95 }}
                             key={watch.id}
                             className="bg-indigo-50/50 dark:bg-indigo-950/10 backdrop-blur-md border border-indigo-200/50 dark:border-indigo-900/30 p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-indigo-500/50 transition-colors"
                          >
                            <div className="flex items-center gap-5 flex-1 min-w-0 pr-4">
                              <div className={`p-3 rounded-xl bg-indigo-500/10 text-indigo-500 shadow-inner relative overflow-hidden`}>
                                  <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-indigo-400/20"></motion.div>
                                  <Search size={20} className="relative z-10" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                 <h3 className="text-base font-medium text-neutral-900 dark:text-white mb-1.5 flex items-center gap-2 truncate">
                                    <span className="truncate">{watch.directory}</span>
                                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-md uppercase font-bold tracking-wider bg-indigo-500/10 text-indigo-500`}>
                                       {watch.status}
                                    </span>
                                 </h3>
                                 <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono truncate">
                                    <span className="bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-md border border-neutral-200 dark:border-border text-indigo-700 dark:text-indigo-400 truncate">⚡ Trigger: {watch.action}</span>
                                 </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                               <button onClick={() => deleteJob(watch.id, true)} className="p-2.5 bg-neutral-100 dark:bg-neutral-900 hover:bg-rose-500/20 text-neutral-600 dark:hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-500/30">
                                  <Trash2 size={18} />
                               </button>
                            </div>
                          </motion.div>
                        ))}
                        </AnimatePresence>
                      </div>
                   )}
               </div>
            </>
        )}

      </div>
    </div>
  );
}
