'use client';

import React, { useState } from 'react';
import { Link2, Check } from 'lucide-react';

interface CopyStudentLinkButtonProps {
  accessToken: string;
  studentName?: string;
}

export function CopyStudentLinkButton({
  accessToken,
  studentName
}: CopyStudentLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://patun-ai.vercel.app';
    const link = `${baseUrl}/exam/${accessToken}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={studentName ? `Copy exam link for ${studentName}` : 'Copy direct exam link'}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-[2px] border text-[11px] font-mono transition-colors ${
        copied
          ? 'bg-verified/10 border-verified/40 text-verified'
          : 'bg-paper border-rule hover:border-ink/40 text-ink'
      }`}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-verified" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Link2 className="w-3 h-3 text-ink-muted" />
          <span>Link</span>
        </>
      )}
    </button>
  );
}
