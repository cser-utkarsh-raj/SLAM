import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApplicationRecord, ApplicationStatus } from '../types';
import { Eye, ChevronRight } from 'lucide-react';

interface TrackerViewProps {
  applications: ApplicationRecord[];
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

const PIPELINE_STAGES = [
  { label: 'DISCOVERED', match: ['DISCOVERED', 'SAVED'] },
  { label: 'PREPARED', match: ['PREPARED', 'READY_TO_APPLY'] },
  { label: 'APPLIED', match: ['APPLIED', 'HUMAN_ACTION_REQUIRED'] },
  { label: 'INTERVIEW', match: ['INTERVIEW'] },
  { label: 'OFFER', match: ['OFFER'] }
];

export const TrackerView: React.FC<TrackerViewProps> = ({
  applications,
  onUpdateStatus,
  onUpdateNotes
}) => {
  const [selectedRecord, setSelectedRecord] = useState<ApplicationRecord | null>(null);

  const stats = useMemo(() => {
    const counts = PIPELINE_STAGES.map(() => 0);
    applications.forEach(app => {
      const stageIndex = PIPELINE_STAGES.findIndex(stage => stage.match.includes(app.status));
      if (stageIndex !== -1) {
        counts[stageIndex]++;
      }
    });
    return counts;
  }, [applications]);

  return (
    <div className="w-full relative min-h-screen">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-0 left-0 w-full h-[500px] bg-[linear-gradient(to_bottom,transparent,rgba(250,204,21,0.05)_50%,transparent)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black text-white leading-[0.9] tracking-tight">
            APPLICATION <br/>
            PIPELINE.
          </h1>
        </motion.div>

        {/* PIPELINE VISUAL */}
        <div className="mb-16 px-4">
           <div className="flex justify-between items-end mb-4 relative">
             {PIPELINE_STAGES.map((stage, i) => (
                <div key={stage.label} className="flex flex-col items-center relative z-10 w-1/5">
                  <div className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-2">{stage.label}</div>
                  <div className={`text-4xl font-display font-black ${stats[i] > 0 ? 'text-white' : 'text-zinc-800'}`}>
                    {stats[i]}
                  </div>
                  <div className={`w-4 h-4 rounded-full mt-4 border-4 border-[#050505] relative z-10 ${stats[i] > 0 ? 'bg-yellow-400' : 'bg-zinc-800'}`}></div>
                </div>
             ))}
             {/* Line */}
             <div className="absolute bottom-1.5 left-[10%] right-[10%] h-[2px] bg-zinc-800 z-0">
                {/* Active line could be calculated, simple version here */}
                <div className="h-full bg-yellow-400/30 w-1/2"></div>
             </div>
           </div>
        </div>

        {/* APPLICATIONS LIST */}
        <div className="space-y-4">
           <AnimatePresence>
             {applications.map((app, index) => (
               <motion.div
                 key={app.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.05 }}
                 className="bg-[#0a0a0a] border border-zinc-900 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-yellow-400/30 transition-colors"
               >
                 <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                     <h3 className="text-xl font-display font-black text-white">{app.jobTitle}</h3>
                     <span className="px-2 py-0.5 bg-zinc-900 text-[10px] uppercase tracking-widest text-zinc-400 font-bold border border-zinc-800">
                       {app.status.replace(/_/g, ' ')}
                     </span>
                   </div>
                   <div className="text-sm font-medium text-zinc-500">
                     {app.company} · {app.location}
                   </div>
                 </div>

                 <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                    <div className="text-right">
                       <div className="uppercase tracking-widest text-[9px] text-zinc-600 mb-1">Applied</div>
                       <div className="text-zinc-300">{app.dateApplied || 'Not yet'}</div>
                    </div>
                    <button
                      onClick={() => setSelectedRecord(app)}
                      className="w-10 h-10 bg-zinc-900 flex items-center justify-center border border-zinc-800 hover:text-yellow-400 hover:border-yellow-400/50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
               </motion.div>
             ))}
           </AnimatePresence>
        </div>

        {/* SIMPLE DETAIL MODAL (Keeping the old modal structure but styling it closer to new design) */}
        <AnimatePresence>
          {selectedRecord && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="bg-[#0a0a0a] border border-zinc-900 max-w-3xl w-full p-8 relative max-h-[85vh] overflow-y-auto">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="absolute top-6 right-6 text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
                
                <h2 className="text-4xl font-display font-black text-white mb-2">{selectedRecord.jobTitle}</h2>
                <div className="text-sm text-zinc-400 mb-8">{selectedRecord.company} • {selectedRecord.location}</div>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Update Status</h4>
                    <select
                      value={selectedRecord.status}
                      onChange={(e) => {
                        const newStat = e.target.value as ApplicationStatus;
                        onUpdateStatus(selectedRecord.id, newStat);
                        setSelectedRecord({ ...selectedRecord, status: newStat });
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-none px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-yellow-400"
                    >
                      {PIPELINE_STAGES.flatMap(s => s.match).map(status => (
                        <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Notes</h4>
                    <textarea
                      rows={2}
                      value={selectedRecord.notes}
                      onChange={(e) => {
                        const n = e.target.value;
                        onUpdateNotes(selectedRecord.id, n);
                        setSelectedRecord({ ...selectedRecord, notes: n });
                      }}
                      placeholder="Add interview feedback..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-none p-3 text-sm text-zinc-200 focus:outline-none focus:border-yellow-400 resize-none"
                    />
                  </div>
                </div>

                {selectedRecord.coverLetter && (
                  <div className="mb-8">
                    <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Cover Letter</h4>
                    <div className="bg-zinc-900 border border-zinc-800 p-6 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {selectedRecord.coverLetter}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
