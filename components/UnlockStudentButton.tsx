'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Unlock, Loader2 } from 'lucide-react';
import { unlockStudentExamAction } from '@/actions/student';
import { Button } from '@/components/ui/Button';

interface UnlockStudentButtonProps {
  studentExamId: string;
  studentName: string;
}

export function UnlockStudentButton({ studentExamId, studentName }: UnlockStudentButtonProps) {
  const router = useRouter();
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      const res = await unlockStudentExamAction(studentExamId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to unlock student exam.');
      }
    } catch (err) {
      console.error('Error unlocking student:', err);
      alert('Error unlocking student exam.');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleUnlock}
      disabled={isUnlocking}
      variant="secondary"
      size="sm"
      className="font-mono text-xs text-signal border-rule hover:border-signal/50"
      title={`Unlock ${studentName}'s examination session`}
    >
      {isUnlocking ? (
        <span className="inline-flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Unlocking...</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1">
          <Unlock className="w-3 h-3" />
          <span>Unlock Session</span>
        </span>
      )}
    </Button>
  );
}
