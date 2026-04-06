import { useState, useEffect } from 'react';
import { Activity, Cpu, Server, Database, Waves } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Heartbeat() {
  const [metrics, setMetrics] = useState({
    cpu: 12,
    memory: 45,
    responseTime: 120,
    loops: 14502
  });

  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.max(1, Math.min(100, prev.cpu + (Math.random() * 10 - 5))),
        memory: Math.max(10, Math.min(90, prev.memory + (Math.random() * 4 - 2))),
        responseTime: Math.max(50, prev.responseTime + (Math.random() * 20 - 10)),
        loops: prev.loops + Math.floor(Math.random() * 3)
      }));

      // Add a mock log occasionally
      if (Math.random() > 0.7) {
        setLogs(prev => {
          const newLog = `[${new Date().toLocaleTimeString()}] Active loop iteration #${metrics.loops + 1} completed.`;
          return [newLog, ...prev].slice(0, 50); // Keep last 50
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [metrics.loops]);

  return (
    <div className="flex-1 p-10 overflow-y-auto w-full custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
           <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shadow-sm relative">
             <Activity size={24} />
             <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
           </div>
           <div>
             <h2 className="text-3xl font-semibold text-neutral-900 dark:text-white">Heartbeat</h2>
             <p className="text-neutral-500 dark:text-neutral-400">Live background process and system monitoring.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           <MetricCard title="CPU Usage" value={`${metrics.cpu.toFixed(1)}%`} icon={<Cpu />} color="text-blue-500" />
           <MetricCard title="Memory" value={`${metrics.memory.toFixed(1)}%`} icon={<Server />} color="text-purple-500" />
           <MetricCard title="Latency" value={`${metrics.responseTime.toFixed(0)}ms`} icon={<Waves />} color="text-emerald-500" />
           <MetricCard title="Total Loops" value={metrics.loops.toLocaleString()} icon={<Database />} color="text-amber-500" />
        </div>

        <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-6 shadow-2xl overflow-hidden relative">
           <div className="flex items-center gap-2 mb-4 p-2 border-b border-neutral-800">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-xs font-mono text-neutral-500">system_worker.log</span>
           </div>
           <div className="h-64 overflow-y-auto font-mono text-sm text-green-400 custom-scrollbar flex flex-col-reverse">
              {logs.map((log, i) => (
                 <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-1 hover:bg-neutral-900 px-2 rounded">
                    {log}
                 </motion.div>
              ))}
              {logs.length === 0 && <div className="text-neutral-600 italic">Waiting for incoming logs...</div>}
           </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
   return (
      <div className="bg-white dark:bg-surface border border-neutral-200 dark:border-border p-6 rounded-2xl shadow-sm flex items-center gap-4">
         <div className={`p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-border ${color}`}>
            {icon}
         </div>
         <div>
            <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{title}</div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{value}</div>
         </div>
      </div>
   )
}
