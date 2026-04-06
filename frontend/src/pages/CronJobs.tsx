import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Play, Pause, RotateCcw, Clock, Trash2, Plus } from 'lucide-react';

interface MockJob {
  id: string;
  name: string;
  schedule: string;
  status: 'active' | 'paused' | 'failed';
  lastRun: string;
  nextRun: string;
}

export default function CronJobs() {
  const [jobs, setJobs] = useState<MockJob[]>([
    { id: '1', name: 'Database Vector Cleanup', schedule: '0 0 * * *', status: 'active', lastRun: '2 hours ago', nextRun: 'in 22 hours' },
    { id: '2', name: 'Memory Log Rotation', schedule: '0 12 * * *', status: 'active', lastRun: '1 hour ago', nextRun: 'in 23 hours' },
    { id: '3', name: 'Nightly Workspace Build', schedule: '30 2 * * *', status: 'paused', lastRun: '2 days ago', nextRun: '-' },
    { id: '4', name: 'Analytics Sync heartbeat', schedule: '*/15 * * * *', status: 'failed', lastRun: '10 mins ago', nextRun: 'in 5 mins' },
  ]);

  const toggleJobStatus = (id: string) => {
    setJobs(jobs.map(j => {
      if (j.id === id) {
         if (j.status === 'failed') return { ...j, status: 'active' };
         return { ...j, status: j.status === 'active' ? 'paused' : 'active' };
      }
      return j;
    }));
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto w-full custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
           <div>
             <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-sm">
                  <CalendarClock size={24} />
                </div>
                <h2 className="text-3xl font-semibold text-neutral-900 dark:text-white">Cron Jobs</h2>
             </div>
             <p className="text-neutral-500 dark:text-neutral-400 ml-15">Schedule and manage background autonomous tasks.</p>
           </div>
           
           <button className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-brand/20">
              <Plus size={16} /> New Job
           </button>
        </div>

        <div className="grid gap-4">
          {jobs.map((job, i) => (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               key={job.id}
               className="bg-white dark:bg-surface border border-neutral-200 dark:border-border p-6 rounded-2xl shadow-sm flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <div className={`p-3 rounded-full ${job.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : job.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                   {job.status === 'active' ? <RotateCcw size={20} className="animate-spin-slow" /> : job.status === 'failed' ? <Trash2 size={20} /> : <Pause size={20} />}
                </div>
                
                <div>
                   <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                      {job.name}
                      <span className={`text-[10px] px-2 py-0.5 rounded-md uppercase font-bold tracking-wider ${job.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : job.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                         {job.status}
                      </span>
                   </h3>
                   <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono">
                      <span className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-md border border-neutral-200 dark:border-border shadow-inner"><Clock size={12} /> {job.schedule}</span>
                      <span>Last: {job.lastRun}</span>
                      <span>Next: {job.nextRun}</span>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => toggleJobStatus(job.id)} className="p-2 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg transition-colors" title={job.status === 'active' ? 'Pause' : 'Resume'}>
                    {job.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                 </button>
                 <button className="p-2 bg-neutral-100 dark:bg-neutral-900 hover:bg-red-500/20 text-neutral-600 dark:hover:text-red-500 rounded-lg transition-colors delay-75">
                    <Trash2 size={16} />
                 </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
