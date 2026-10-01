'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  iconOnly?: boolean;
  title?: string;
}

export function CopyButton({
  text,
  label,
  copiedLabel = 'Copied!',
  className = '',
  iconOnly = false,
  title = 'Copy to clipboard'
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure context
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title}
      className={`inline-flex items-center gap-1.5 transition-colors font-mono text-xs ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-verified" />
          {!iconOnly && <span className="text-verified font-medium">{copiedLabel}</span>}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-ink-muted group-hover:text-ink" />
          {!iconOnly && <span>{label || 'Copy'}</span>}
        </>
      )}
    </button>
  );
}
