'use server';

import { auth } from '@/lib/auth';
import { dbService, PastMaterialRecord } from '@/lib/db';

export async function getPastMaterialsAction(): Promise<{
  success: boolean;
  materials?: PastMaterialRecord[];
  error?: string;
}> {
  try {
    const session = await auth();
    const teacherEmail = session?.user?.email || null;

    const materials = await dbService.getPastMaterials(teacherEmail);

    // If teacher has no explicitly saved past materials yet,
    // intelligently discover lesson contents from previously created exams
    if (materials.length === 0) {
      const exams = teacherEmail 
        ? await dbService.getExamsByTeacherEmail(teacherEmail)
        : await dbService.getAllExams();

      const derived: PastMaterialRecord[] = exams
        .filter((e) => e.lessonContent && e.lessonContent.trim().length > 30)
        .map((e) => ({
          id: `derived_${e.id}`,
          teacherEmail: e.teacherEmail,
          fileName: `${e.subject} - ${e.title}.txt`,
          fileSize: Buffer.byteLength(e.lessonContent, 'utf8'),
          mimeType: 'text/plain',
          title: e.title,
          subject: e.subject,
          extractedContent: e.lessonContent,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt || e.createdAt
        }));

      return { success: true, materials: derived };
    }

    return { success: true, materials };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error retrieving past materials';
    return { success: false, error: message };
  }
}

export async function savePastMaterialAction(input: {
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  title?: string;
  subject?: string;
  extractedContent: string;
}): Promise<{
  success: boolean;
  material?: PastMaterialRecord;
  error?: string;
}> {
  try {
    const session = await auth();
    const teacherEmail = session?.user?.email || null;

    if (!input.extractedContent || input.extractedContent.trim().length === 0) {
      return { success: false, error: 'Document content cannot be empty.' };
    }

    const material = await dbService.createPastMaterial({
      teacherEmail,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      title: input.title,
      subject: input.subject,
      extractedContent: input.extractedContent
    });

    return { success: true, material };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error saving material';
    return { success: false, error: message };
  }
}

export async function deletePastMaterialAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (id.startsWith('derived_')) {
      // Derived from an exam, cannot be deleted from materials table directly
      return { success: true };
    }

    await dbService.deletePastMaterial(id);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting material';
    return { success: false, error: message };
  }
}
