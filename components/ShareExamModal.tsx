'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { 
  Share2, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Key, 
  Link2, 
  Search 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ShareExamModalProps {
  exam: {
    id: string;
    title: string;
    subject: string;
    accessCode: string;
    durationMinutes: number;
    googleCourseName?: string | null;
  };
  students: Array<{
    id: string;
    studentName: string;
    studentEmail?: string | null;
    accessCode?: string | null;
    accessToken: string;
  }>;
}

const emptySubscribe = () => () => {};

export function ShareExamModal({ exam, students }: ShareExamModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'individual' | 'batch'>('quick');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const origin = useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== 'undefined' ? window.location.origin : 'https://patun-ai.vercel.app'),
    () => 'https://patun-ai.vercel.app'
  );

  const baseUrl = origin || 'https://patun-ai.vercel.app';
  const portalUrl = `${baseUrl}/?code=${exam.accessCode}`;

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const announcementText = `📝 Exam Assessment: ${exam.title}
📚 Subject: ${exam.subject}
⏱ Duration: ${exam.durationMinutes} Minutes

🔗 Direct Exam Portal (Auto-fills PIN):
${portalUrl}

🔑 6-Digit Access PIN:
${exam.accessCode}

Instructions:
1. Click the portal link above or visit ${baseUrl} and enter PIN: ${exam.accessCode}
2. Ensure you have a quiet environment and do not switch tabs during the assessment.`;

  const filteredStudents = students.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.studentEmail && s.studentEmail.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const batchLinksText = students
    .map(
      (s) =>
        `${s.studentName}\t${s.accessCode || exam.accessCode}\t${baseUrl}/exam/${s.accessToken}`
    )
    .join('\n');

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        variant="secondary"
        size="md"
        className="font-mono text-xs text-ink"
      >
        <Share2 className="w-3.5 h-3.5 mr-1.5" />
        <span>Share &amp; Links</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl bg-paper border border-rule rounded-[2px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-rule bg-ground">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-ink" />
                  <h3 className="text-sm font-semibold text-ink uppercase tracking-wider font-mono">
                    Exam Link Maker &amp; Access Dispatcher
                  </h3>
                </div>
                <p className="text-xs text-ink-muted">
                  {exam.title} &bull; Access PIN: <strong className="text-ink font-mono">{exam.accessCode}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-[2px] text-ink-muted hover:text-ink hover:bg-paper transition-colors"
                title="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-rule px-5 bg-paper font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('quick')}
                className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
                  activeTab === 'quick'
                    ? 'border-ink text-ink font-semibold'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                Quick Portal Link &amp; PIN
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('individual')}
                className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
                  activeTab === 'individual'
                    ? 'border-ink text-ink font-semibold'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                Individual Candidate Links ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('batch')}
                className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
                  activeTab === 'batch'
                    ? 'border-ink text-ink font-semibold'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                Batch Export
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6">
              {/* TAB 1: QUICK SHARE */}
              {activeTab === 'quick' && (
                <div className="space-y-5">
                  {/* Pre-filled Link Maker */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted">
                      1. Exam Portal Link (Auto-fills PIN for students)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={portalUrl}
                        className="flex-1 px-3 py-2 text-xs font-mono bg-ground border border-rule rounded-[2px] text-ink select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(portalUrl, 'portal_link')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[2px] bg-ink text-paper hover:bg-ink/90 text-xs font-mono font-medium transition-colors"
                      >
                        {copiedField === 'portal_link' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-verified" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                      <a
                        href={portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-[2px] bg-paper border border-rule hover:border-ink/40 text-ink-muted hover:text-ink transition-colors"
                        title="Test portal link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* 6-Digit Access PIN Card */}
                  <div className="p-4 rounded-[2px] bg-ground border border-rule space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-ink-muted" />
                        <span className="text-xs font-mono uppercase tracking-wider text-ink font-semibold">
                          2. 6-Digit Access PIN
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(exam.accessCode, 'access_pin')}
                        className="inline-flex items-center gap-1 text-xs font-mono text-ink-muted hover:text-ink"
                      >
                        {copiedField === 'access_pin' ? (
                          <>
                            <Check className="w-3 h-3 text-verified" />
                            <span className="text-verified">PIN Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy PIN</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-2xl font-bold font-mono text-ink tracking-widest">
                      {exam.accessCode}
                    </div>
                    <p className="text-[11px] text-ink-muted leading-relaxed">
                      <strong>Why do you need this?</strong> You can announce or write this PIN on the board. Students can open 
                      <span className="font-mono text-ink"> {baseUrl} </span> on any phone, tablet, or browser and type this PIN to immediately enter their personalized exam session without needing a direct link.
                    </p>
                  </div>

                  {/* Ready-to-Send Announcement */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-mono uppercase tracking-wider text-ink-muted">
                        3. Ready-to-Send Classroom Announcement
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(announcementText, 'announcement')}
                        className="inline-flex items-center gap-1 text-xs font-mono text-ink-muted hover:text-ink"
                      >
                        {copiedField === 'announcement' ? (
                          <>
                            <Check className="w-3 h-3 text-verified" />
                            <span className="text-verified">Announcement Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Announcement</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      rows={7}
                      value={announcementText}
                      className="w-full p-3 text-xs font-mono bg-ground border border-rule rounded-[2px] text-ink leading-relaxed select-all focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: INDIVIDUAL LINKS */}
              {activeTab === 'individual' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-ink-muted" />
                    <input
                      type="text"
                      placeholder="Filter candidate by name or email..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-ground border border-rule rounded-[2px] text-ink focus:outline-none focus:border-ink"
                    />
                  </div>

                  <div className="border border-rule rounded-[2px] divide-y divide-rule max-h-80 overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-xs text-ink-muted font-mono">
                        No candidates found matching filter.
                      </div>
                    ) : (
                      filteredStudents.map((st) => {
                        const directUrl = `${baseUrl}/exam/${st.accessToken}`;
                        const isCopied = copiedField === `st_${st.id}`;
                        return (
                          <div
                            key={st.id}
                            className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-ground/50 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <div className="text-xs font-medium text-ink font-sans">
                                {st.studentName}
                              </div>
                              <div className="text-[11px] font-mono text-ink-muted flex items-center gap-2">
                                <span>PIN: {st.accessCode || exam.accessCode}</span>
                                {st.studentEmail && (
                                  <>
                                    <span>&bull;</span>
                                    <span>{st.studentEmail}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(directUrl, `st_${st.id}`)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] text-xs font-mono transition-colors border ${
                                  isCopied
                                    ? 'bg-verified/10 border-verified/40 text-verified'
                                    : 'bg-paper border-rule hover:border-ink/40 text-ink'
                                }`}
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3 h-3 text-verified" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-ink-muted" />
                                    <span>Copy Direct Link</span>
                                  </>
                                )}
                              </button>
                              <a
                                href={directUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-[2px] bg-paper border border-rule hover:border-ink/40 text-ink-muted hover:text-ink transition-colors"
                                title="Open student variant"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: BATCH EXPORT */}
              {activeTab === 'batch' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink-muted">
                      Tab-separated format (Candidate Name, PIN, Direct Link). Ready to paste into Excel or Google Sheets.
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(batchLinksText, 'batch_all')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-ink text-paper hover:bg-ink/90 text-xs font-mono font-medium transition-colors"
                    >
                      {copiedField === 'batch_all' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-verified" />
                          <span>Copied All!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy All Table Rows</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    readOnly
                    rows={10}
                    value={batchLinksText}
                    className="w-full p-3 text-xs font-mono bg-ground border border-rule rounded-[2px] text-ink leading-relaxed select-all focus:outline-none whitespace-pre"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-rule bg-ground flex items-center justify-end">
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                variant="secondary"
                size="md"
                className="font-mono text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
