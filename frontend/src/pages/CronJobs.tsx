import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Play, RotateCcw, Clock, Trash2, Plus, Eye, Zap, Search, X, ShieldAlert } from 'lucide-react';
import axios from 'axios';

interface LiveJob {
  id: string;
  command: string;
  schedule_type?: string;
  interval_minutes: number;
  cron_time?: string;
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

  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState<'cron' | 'watchdog'>('cron');
  const [scheduleType, setScheduleType] = useState<'interval' | 'time'>('interval');
  const [cronCommand, setCronCommand] = useState('');
  const [cronInterval, setCronInterval] = useState(60);
  const [cronTime, setCronTime] = useState('10:00');
  const [watchDir, setWatchDir] = useState('/tmp/');
  const [watchAction, setWatchAction] = useState('Analyze new files dropped here.');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleCreate = async () => {
      setSubmitting(true);
      setErrorMsg(null);
      try {
          if (createType === 'cron') {
             await axios.post('http://localhost:8000/api/cron', {
                 command: cronCommand,
                 schedule_type: scheduleType,
                 interval_minutes: cronInterval,
                 cron_time: cronTime
             });
          } else {
             await axios.post('http://localhost:8000/api/watchdog', {
                 directory: watchDir,
                 action: watchAction
             });
          }
          setIsCreating(false);
          setCronCommand('');
          fetchData();
      } catch (e: any) {
          console.error(e);
          setErrorMsg(e.response?.data?.detail || e.message || 'An unknown error occurred');
      } finally {
          setSubmitting(false);
      }
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto w-full custom-scrollbar bg-transparent text-[#3A3838] dark:text-[#E2DAD2]">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-10">
           <div>
             <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand-hover text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
                  <Zap size={24} />
                </div>
                <h2 className="text-3xl font-semibold text-[#3A3838] dark:text-[#E2DAD2]">Omnipotent Task Center</h2>
             </div>
             <p className="text-[#B8AFA8] dark:text-[#B8AFA8] max-w-2xl leading-relaxed">Give AI true agency. Agents can execute advanced tasks in the background, automatically controlling your PC to handle tedious work, from file organization to complex workflow automation.</p>
             <div className="flex gap-3 mt-4">
                 <span className="px-3 py-1 bg-brand/10 text-brand text-xs font-bold uppercase tracking-wider rounded-lg border border-brand/20 shadow-sm">System-Level Access</span>
                 <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-lg border border-emerald-500/20 shadow-sm">Automated Workflows</span>
             </div>
           </div>
           
           <button 
             onClick={() => setIsCreating(true)}
             className="bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-brand/20 flex items-center gap-2"
           >
              <Plus size={18} /> Create Autonomous Task
           </button>
        </div>

        {loading ? (
             <div className="flex items-center justify-center py-20">
                <RotateCcw size={32} className="animate-spin text-brand" />
             </div>
        ) : (
            <>
               <div className="mb-10">
                   <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b border-[#E2DAD2] dark:border-border pb-2"><CalendarClock size={20} className="text-brand"/> Autonomous Schedules (Cron)</h3>
                   {jobs.length === 0 ? (
                       <div className="p-8 text-center text-[#B8AFA8] border border-dashed border-[#E2DAD2] dark:border-border rounded-2xl">No background crons active. Spawn a new loop to fully automate your OS.</div>
                   ) : (
                      <div className="grid gap-4">
                        <AnimatePresence>
                        {jobs.map((job) => (
                          <motion.div 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, scale: 0.95 }}
                             key={job.id}
                             className="bg-white/80 dark:bg-surface/80 backdrop-blur-md border border-[#E2DAD2] dark:border-border p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-brand/50 transition-colors"
                          >
                            <div className="flex items-center gap-5 flex-1 min-w-0 pr-4">
                              <div className={`p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shadow-inner`}>
                                  <RotateCcw size={20} className="animate-spin-slow" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                 <h3 className="text-base font-medium text-[#3A3838] dark:text-[#E2DAD2] mb-1.5 flex items-center gap-2">
                                    <span className="truncate">{job.command}</span>
                                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-md uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-500`}>
                                       {job.status}
                                    </span>
                                 </h3>
                                  <div className="flex items-center gap-4 text-xs text-[#B8AFA8] font-mono">
                                     <span className="flex items-center gap-1 bg-[#EDE8E2] dark:bg-[#1E1C1C] px-2 py-1 rounded-md border border-[#E2DAD2] dark:border-border">
                                        <Clock size={12} /> 
                                        {job.schedule_type === 'time' ? `Daily at ${job.cron_time}` : `Every ${job.interval_minutes}m`}
                                     </span>
                                     {job.next_run_time && <span className="text-brand flex items-center gap-1"><Play size={10} className="fill-brand"/> Next: {new Date(job.next_run_time).toLocaleTimeString()}</span>}
                                  </div>
                              </div>
                            </div>

                            <button onClick={() => deleteJob(job.id, false)} className="p-2.5 bg-[#EDE8E2] dark:bg-[#1E1C1C] hover:bg-rose-500/20 text-[#3A3838]/80 dark:hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-500/30">
                               <Trash2 size={18} />
                            </button>
                          </motion.div>
                        ))}
                        </AnimatePresence>
                      </div>
                   )}
               </div>

               <div>
                   <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b border-[#E2DAD2] dark:border-border pb-2"><Eye size={20} className="text-brand"/> System Watchdogs</h3>
                   {watchdogs.length === 0 ? (
                       <div className="p-8 text-center text-[#B8AFA8] border border-dashed border-[#E2DAD2] dark:border-border rounded-2xl">No Watchdogs active. Assign the agent to persistently monitor a local directory.</div>
                   ) : (
                      <div className="grid gap-4">
                        <AnimatePresence>
                        {watchdogs.map((watch) => (
                          <motion.div 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, scale: 0.95 }}
                             key={watch.id}
                             className="bg-brand/10/50 dark:bg-indigo-950/10 backdrop-blur-md border border-brand/30/50 dark:border-indigo-900/30 p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-brand/50 transition-colors"
                          >
                            <div className="flex items-center gap-5 flex-1 min-w-0 pr-4">
                              <div className={`p-3 rounded-xl bg-brand/10 text-brand shadow-inner relative overflow-hidden`}>
                                  <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-brand/20"></motion.div>
                                  <Search size={20} className="relative z-10" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                 <h3 className="text-base font-medium text-[#3A3838] dark:text-[#E2DAD2] mb-1.5 flex items-center gap-2 truncate">
                                    <span className="truncate">{watch.directory}</span>
                                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-md uppercase font-bold tracking-wider bg-brand/10 text-brand`}>
                                       {watch.status}
                                    </span>
                                 </h3>
                                 <div className="flex items-center gap-4 text-xs text-[#B8AFA8] font-mono truncate">
                                    <span className="bg-[#EDE8E2] dark:bg-[#1E1C1C] px-2 py-1 rounded-md border border-[#E2DAD2] dark:border-border text-brand-hover dark:text-brand truncate">⚡ Trigger: {watch.action}</span>
                                 </div>
                              </div>
                            </div>

                            <button onClick={() => deleteJob(watch.id, true)} className="p-2.5 bg-[#EDE8E2] dark:bg-[#1E1C1C] hover:bg-rose-500/20 text-[#3A3838]/80 dark:hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-500/30">
                               <Trash2 size={18} />
                            </button>
                          </motion.div>
                        ))}
                        </AnimatePresence>
                      </div>
                   )}
               </div>
            </>
        )}
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
         {isCreating && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               {/* Modal Backdrop */}
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#1E1C1C]/60 dark:bg-black/60 backdrop-blur-sm"
                  onClick={() => setIsCreating(false)}
               />
               
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-white dark:bg-[#1E1C1C] w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 border border-[#E2DAD2] dark:border-[#3A3838] overflow-hidden flex flex-col max-h-[90vh]"
               >
                  <div className="p-6 border-b border-[#E2DAD2] dark:border-[#3A3838] flex justify-between items-center bg-[#EDE8E2]/50 dark:bg-[#1A1818]/50 shrink-0">
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-brand text-white rounded-xl shadow-lg shadow-brand/20">
                            <Zap size={20} />
                         </div>
                         <div>
                            <h3 className="text-xl font-bold text-[#3A3838] dark:text-[#E2DAD2]">Spawn Autonomous Action</h3>
                            <p className="text-sm text-[#B8AFA8]">Provide direct instructions to the OS agent ring.</p>
                         </div>
                      </div>
                      <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-[#E2DAD2] dark:hover:bg-[#2A2828] rounded-lg text-[#B8AFA8] transition-colors">
                         <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                      
                      <div className="flex gap-2 p-1.5 bg-[#EDE8E2] dark:bg-[#1A1818] rounded-xl">
                          <button 
                             onClick={() => setCreateType('cron')}
                             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${createType === 'cron' ? 'bg-white dark:bg-[#2A2828] text-brand shadow-sm' : 'text-[#B8AFA8] hover:text-[#3A3838] dark:hover:text-[#B8AFA8]/60'}`}
                          >
                             <CalendarClock size={16} /> Autonomous Schedule
                          </button>
                          <button 
                             onClick={() => setCreateType('watchdog')}
                             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${createType === 'watchdog' ? 'bg-white dark:bg-[#2A2828] text-brand shadow-sm' : 'text-[#B8AFA8] hover:text-[#3A3838] dark:hover:text-[#B8AFA8]/60'}`}
                          >
                             <Eye size={16} /> Directory Watchdog
                          </button>
                      </div>

                      {createType === 'cron' ? (
                          <div className="flex flex-col gap-5">
                             <div>
                                <label className="block text-sm font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 mb-2">Agent Directive</label>
                                <textarea 
                                   value={cronCommand}
                                   onChange={(e) => setCronCommand(e.target.value)}
                                   placeholder="e.g. Email me a summary of tasks scheduled for today."
                                   className="w-full bg-white dark:bg-[#1A1818] border border-[#E2DAD2] dark:border-border rounded-xl p-4 text-sm focus:outline-none focus:border-brand/50 dark:focus:border-brand/50 min-h-[120px] resize-none"
                                />
                             </div>
                             
                             <div className="flex gap-2 p-1 bg-[#EDE8E2] dark:bg-[#1E1C1C] rounded-lg w-fit">
                               <button 
                                  onClick={() => setScheduleType('interval')}
                                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${scheduleType === 'interval' ? 'bg-white dark:bg-[#2A2828] text-brand shadow-sm' : 'text-[#B8AFA8] hover:text-[#3A3838] dark:hover:text-[#B8AFA8]/60'}`}
                               >
                                  Interval
                               </button>
                               <button 
                                  onClick={() => setScheduleType('time')}
                                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${scheduleType === 'time' ? 'bg-white dark:bg-[#2A2828] text-brand shadow-sm' : 'text-[#B8AFA8] hover:text-[#3A3838] dark:hover:text-[#B8AFA8]/60'}`}
                               >
                                  Specific Time
                               </button>
                             </div>

                             {scheduleType === 'interval' ? (
                               <div>
                                  <label className="block text-sm font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 mb-2">Execution Interval (Minutes)</label>
                                  <div className="flex items-center gap-4 bg-white dark:bg-[#1A1818] border border-[#E2DAD2] dark:border-border rounded-xl p-3">
                                     <Clock size={16} className="text-[#B8AFA8]" />
                                     <input 
                                        type="number" 
                                        min={1}
                                        value={cronInterval}
                                        onChange={(e) => setCronInterval(Number(e.target.value))}
                                        className="bg-transparent border-none focus:outline-none flex-1 text-sm font-mono text-[#3A3838] dark:text-[#E2DAD2]"
                                     />
                                  </div>
                               </div>
                             ) : (
                               <div>
                                  <label className="block text-sm font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 mb-2">Daily Execution Time</label>
                                  <div className="flex items-center gap-4 bg-white dark:bg-[#1A1818] border border-[#E2DAD2] dark:border-border rounded-xl p-3">
                                     <Clock size={16} className="text-[#B8AFA8]" />
                                     <input 
                                        type="time" 
                                        value={cronTime}
                                        onChange={(e) => setCronTime(e.target.value)}
                                        className="bg-transparent border-none focus:outline-none flex-1 text-sm font-mono text-[#3A3838] dark:text-[#E2DAD2]"
                                     />
                                  </div>
                               </div>
                             )}
                          </div>
                      ) : (
                          <div className="flex flex-col gap-5">
                             <div>
                                <label className="block text-sm font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 mb-2 flex items-center justify-between">
                                   Absolute Directory Path 
                                   <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded flex items-center gap-1"><ShieldAlert size={10} /> Local Access Required</span>
                                </label>
                                <input 
                                   type="text"
                                   value={watchDir}
                                   onChange={(e) => setWatchDir(e.target.value)}
                                   placeholder="C:/Users/Name/Downloads"
                                   className="w-full bg-white dark:bg-[#1A1818] border border-[#E2DAD2] dark:border-border rounded-xl p-3.5 text-sm focus:outline-none focus:border-brand/50 font-mono"
                                />
                             </div>
                             <div>
                                <label className="block text-sm font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 mb-2">Trigger Action (Event Payload)</label>
                                <textarea 
                                   value={watchAction}
                                   onChange={(e) => setWatchAction(e.target.value)}
                                   placeholder="Organize the newly dropped file. If it is an image, move it to /Pictures."
                                   className="w-full bg-white dark:bg-[#1A1818] border border-[#E2DAD2] dark:border-border rounded-xl p-4 text-sm focus:outline-none focus:border-brand/50 min-h-[100px] resize-none"
                                />
                             </div>
                          </div>
                      )}
                  </div>

                  {errorMsg && (
                      <div className="px-6 pb-2">
                          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm flex items-center gap-2">
                              <ShieldAlert size={16} />
                              <span className="font-medium">{errorMsg}</span>
                          </div>
                      </div>
                  )}

                  <div className="p-6 border-t border-[#E2DAD2] dark:border-[#3A3838] bg-[#EDE8E2] dark:bg-[#1A1818] shrink-0 flex justify-end gap-3 flex-row-reverse">
                      <button 
                         onClick={handleCreate}
                         disabled={submitting || (createType === 'cron' ? !cronCommand.trim() : !watchDir.trim())}
                         className={`px-6 py-3 rounded-xl font-medium shadow-lg transition-colors flex items-center gap-2 text-white ${
                            createType === 'cron' 
                                ? 'bg-brand hover:bg-brand-hover shadow-brand/20 disabled:bg-brand/50' 
                                : 'bg-brand hover:bg-brand-hover shadow-brand/20 disabled:bg-brand/50'
                         }`}
                      >
                         {submitting ? <RotateCcw size={18} className="animate-spin" /> : <Play size={18} />} Activate System Link
                      </button>
                      <button 
                         onClick={() => setIsCreating(false)}
                         className="px-6 py-3 bg-white dark:bg-[#1E1C1C] border border-[#E2DAD2] dark:border-[#3A3838] hover:bg-[#EDE8E2] dark:hover:bg-[#2A2828] rounded-xl text-[#3A3838] dark:text-[#E2DAD2]/80 font-medium transition-colors"
                      >
                         Cancel
                      </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

    </div>
  );
}
