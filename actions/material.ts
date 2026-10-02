'use server';

import { auth } from '@/lib/auth';
import { dbService, PastMaterialRecord } from '@/lib/db';
import { extractLessonFromDocument, DocumentInput } from '@/lib/gemini';

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

export async function deleteMultiplePastMaterialsAction(ids: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    for (const id of ids) {
      if (!id.startsWith('derived_')) {
        await dbService.deletePastMaterial(id);
      }
    }
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting materials';
    return { success: false, error: message };
  }
}

export async function uploadMultipleToPastMaterialsAction(formData: FormData): Promise<{
  success: boolean;
  addedCount?: number;
  materials?: PastMaterialRecord[];
  error?: string;
}> {
  try {
    const session = await auth();
    const teacherEmail = session?.user?.email || null;

    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return { success: false, error: 'No files were uploaded.' };
    }

    const addedMaterials: PastMaterialRecord[] = [];

    for (const file of files) {
      const mimeType = file.type || 'application/pdf';
      const isTxt = mimeType === 'text/plain' || file.name.toLowerCase().endsWith('.txt');
      const isPdf = mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImg = mimeType.startsWith('image/');

      if (!isTxt && !isPdf && !isImg) {
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > 20 * 1024 * 1024) {
        continue;
      }

      if (isTxt) {
        const textContent = buffer.toString('utf-8');
        if (textContent.trim()) {
          const title = file.name.replace(/\.[^/.]+$/, '');
          const material = await dbService.createPastMaterial({
            teacherEmail,
            fileName: file.name,
            fileSize: buffer.length,
            mimeType: 'text/plain',
            title,
            subject: 'Study Material',
            extractedContent: textContent.trim()
          });
          addedMaterials.push(material);
        }
      } else {
        const docInput: DocumentInput = {
          base64Data: buffer.toString('base64'),
          mimeType,
          fileName: file.name
        };
        const extracted = await extractLessonFromDocument(docInput.base64Data, docInput.mimeType, docInput.fileName);
        const material = await dbService.createPastMaterial({
          teacherEmail,
          fileName: file.name,
          fileSize: buffer.length,
          mimeType,
          title: extracted.title || file.name.replace(/\.[^/.]+$/, ''),
          subject: extracted.subject || 'Study Material',
          extractedContent: extracted.extractedContent || `Lesson content extracted from ${file.name}`
        });
        addedMaterials.push(material);
      }
    }

    if (addedMaterials.length === 0) {
      return { success: false, error: 'No valid files could be processed.' };
    }

    return { success: true, addedCount: addedMaterials.length, materials: addedMaterials };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error uploading materials to library';
    return { success: false, error: message };
  }
}

