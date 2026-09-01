import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Briefcase, 
  FileText, 
  AlertCircle, 
  Eye, 
  ChevronRight, 
  TrendingUp, 
  Check, 
  DollarSign, 
  MapPin, 
  Building 
} from 'lucide-react';
import { ApplicationRecord, ApplicationStatus } from '../types';

interface TrackerViewProps {
  applications: ApplicationRecord[];
  onUpdateStatus: (id: string, newStatus: ApplicationStatus) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

export const TrackerView: React.FC<TrackerViewProps> = ({
  applications,
  onUpdateStatus,
  onUpdateNotes,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ApplicationRecord | null>(null);

  const statuses: ApplicationStatus[] = [
    'DISCOVERED',
    'SAVED',
    'PREPARED',
    'READY_TO_APPLY',
    'APPLIED',
    'HUMAN_ACTION_REQUIRED',
    'INTERVIEW',
    'OFFER',
    'REJECTED',
    'WITHDRAWN',
  ];

  const filtered = applications.filter((app) => {
    if (filterStatus !== 'ALL' && app.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return app.company.toLowerCase().includes(q) || app.jobTitle.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate Metrics
  const totalCount = applications.length;
  const appliedCount = applications.filter((a) => ['APPLIED', 'INTERVIEW', 'OFFER'].includes(a.status)).length;
  const interviewCount = applications.filter((a) => a.status === 'INTERVIEW').length;
  const offerCount = applications.filter((a) => a.status === 'OFFER').length;
  const interviewRate = appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0;

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'INTERVIEW':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">INTERVIEW</span>;
      case 'OFFER':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">OFFER</span>;
      case 'APPLIED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">APPLIED</span>;
      case 'PREPARED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-yellow-950 text-yellow-300 border border-yellow-800">PREPARED</span>;
      case 'HUMAN_ACTION_REQUIRED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">ACTION REQUIRED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">REJECTED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 font-display">
          <BarChart3 className="w-6 h-6 text-yellow-400" />
          <span>Application Tracker &amp; Outcome Insights</span>
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1 font-medium">
          Monitor your application lifecycle, inspect exact submitted materials, and correlate compatibility scores with interview rates.
        </p>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Total Tracked</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">{totalCount}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Active opportunities</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Applied</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-blue-400 mt-1">{appliedCount}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Submitted packages</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Interviews</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400 mt-1">{interviewCount}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Active conversations</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Interview Rate</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1">{interviewRate}%</div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Conversion on tailored CVs</span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tracked applications by company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-zinc-400 whitespace-nowrap">Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400"
          >
            <option value="ALL">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400 text-xs">
            No applications match your current filters.
          </div>
        ) : (
          filtered.map((app) => (
            <div
              key={app.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">{app.jobTitle}</h3>
                  {getStatusBadge(app.status)}
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    {app.applicationMode} MODE
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-200">{app.company}</span>
                  <span>{app.location}</span>
                  {app.salaryText && <span className="text-emerald-400 font-mono">{app.salaryText}</span>}
                  <span className="font-mono text-zinc-500 text-[11px]">
                    Discovered: {app.dateDiscovered}
                  </span>
                  {app.dateApplied && (
                    <span className="font-mono text-blue-400 text-[11px]">
                      Applied: {app.dateApplied}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Updater & Inspect Drawer Button */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <select
                  value={app.status}
                  onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-yellow-400"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setSelectedRecord(app)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RECORD INSPECTION DRAWER / MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2"
            >
              ✕
            </button>

            <div className="border-b border-zinc-800 pb-4 pr-10">
              <div className="flex items-center gap-2 mb-1">
                {getStatusBadge(selectedRecord.status)}
                <span className="text-xs font-mono text-zinc-400">Application Audit Record</span>
              </div>
              <h2 className="text-xl font-bold text-white">{selectedRecord.jobTitle}</h2>
              <div className="text-xs text-zinc-400 mt-1">{selectedRecord.company} • {selectedRecord.location}</div>
            </div>

            <div className="space-y-5 text-xs text-zinc-300">
              {/* Status Update & Notes */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-zinc-400 uppercase text-[11px]">Application Status</span>
                  <select
                    value={selectedRecord.status}
                    onChange={(e) => {
                      const newStat = e.target.value as ApplicationStatus;
                      onUpdateStatus(selectedRecord.id, newStat);
                      setSelectedRecord({ ...selectedRecord, status: newStat });
                    }}
                    className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1 uppercase">Candidate Notes &amp; Follow-up</label>
                  <textarea
                    rows={3}
                    value={selectedRecord.notes}
                    onChange={(e) => {
                      const n = e.target.value;
                      onUpdateNotes(selectedRecord.id, n);
                      setSelectedRecord({ ...selectedRecord, notes: n });
                    }}
                    placeholder="Add interview feedback, recruiter contact notes, or next steps..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              {/* Cover Letter Submitted */}
              {selectedRecord.coverLetter && (
                <div className="space-y-1.5">
                  <h4 className="font-mono font-bold text-yellow-400 uppercase text-[11px]">Cover Letter Submitted</h4>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {selectedRecord.coverLetter}
                  </div>
                </div>
              )}

              {/* Screening Answers Submitted */}
              {selectedRecord.submittedAnswers && selectedRecord.submittedAnswers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-mono font-bold text-yellow-400 uppercase text-[11px]">Screening Answers Submitted</h4>
                  <div className="space-y-2">
                    {selectedRecord.submittedAnswers.map((ans, idx) => (
                      <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-1">
                        <div className="font-bold text-zinc-200">{ans.question}</div>
                        <div className="text-zinc-400 font-mono text-[11px]">{ans.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <a
                href={selectedRecord.applicationUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs text-zinc-400 hover:text-white underline font-mono"
              >
                Open Official Portal URL
              </a>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-yellow-400 text-black text-xs font-bold rounded-lg"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
