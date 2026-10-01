import { google } from 'googleapis';

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string | null;
  descriptionHeading?: string | null;
}

export interface ClassroomStudent {
  id: string;
  name: string;
  email: string;
}

/**
 * Fetches all active courses taught by the authenticated teacher.
 */
export async function fetchTeacherCourses(accessToken: string): Promise<ClassroomCourse[]> {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const classroom = google.classroom({ version: 'v1', auth });
    const response = await classroom.courses.list({
      teacherId: 'me',
      courseStates: ['ACTIVE']
    });

    const courses = response.data.courses || [];
    return courses
      .filter((c) => c.id && c.name)
      .map((c) => ({
        id: c.id as string,
        name: c.name as string,
        section: c.section || null,
        descriptionHeading: c.descriptionHeading || null
      }));
  } catch (err) {
    console.error('fetchTeacherCourses error:', err);
    throw err;
  }
}

/**
 * Fetches the enrolled student roster for a specific Google Classroom course.
 */
export async function fetchCourseRoster(
  accessToken: string,
  courseId: string
): Promise<ClassroomStudent[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const classroom = google.classroom({ version: 'v1', auth });

  const studentMap = new Map<string, ClassroomStudent>();

  // 1. Fetch enrolled students
  try {
    const response = await classroom.courses.students.list({
      courseId,
      pageSize: 100
    });

    const rawStudents = response.data.students || [];
    console.log(`[Google Classroom] courses.students.list returned ${rawStudents.length} students for course ${courseId}`);

    for (let i = 0; i < rawStudents.length; i++) {
      const s = rawStudents[i];
      const userId = s.userId || s.profile?.id || `student_${i + 1}`;
      let fullName =
        s.profile?.name?.fullName ||
        [s.profile?.name?.givenName, s.profile?.name?.familyName].filter(Boolean).join(' ') ||
        `Student ${i + 1}`;
      let email = s.profile?.emailAddress || '';

      // If email is missing from profile, try userProfiles.get
      if (!email && s.userId) {
        try {
          const userRes = await classroom.userProfiles.get({ userId: s.userId });
          if (userRes.data?.emailAddress) {
            email = userRes.data.emailAddress;
          }
          if (!fullName && userRes.data?.name?.fullName) {
            fullName = userRes.data.name.fullName;
          }
        } catch (profileErr) {
          console.warn(`[Google Classroom] Could not fetch userProfile for ${s.userId}:`, profileErr);
        }
      }

      studentMap.set(userId, {
        id: userId,
        name: fullName,
        email: email || ''
      });
    }
  } catch (err: unknown) {
    console.error(`[Google Classroom] courses.students.list error for course ${courseId}:`, err);
  }

  // 2. Fetch pending student invitations (in case students haven't accepted yet)
  try {
    const invRes = await classroom.invitations.list({
      courseId
    });

    const invitations = (invRes.data.invitations || []).filter((inv) => inv.role === 'STUDENT');
    console.log(`[Google Classroom] invitations.list returned ${invitations.length} student invitations for course ${courseId}`);

    for (let i = 0; i < invitations.length; i++) {
      const inv = invitations[i];
      const userId = inv.userId || `invitee_${i + 1}`;
      if (!studentMap.has(userId)) {
        let name = `Invited Student (${userId.slice(-4)})`;
        let email = '';

        if (inv.userId) {
          try {
            const userRes = await classroom.userProfiles.get({ userId: inv.userId });
            if (userRes.data?.emailAddress) email = userRes.data.emailAddress;
            if (userRes.data?.name?.fullName) name = userRes.data.name.fullName;
          } catch {
            // Ignore
          }
        }

        studentMap.set(userId, {
          id: userId,
          name,
          email
        });
      }
    }
  } catch (invErr) {
    // Invitations might fail if user does not have permission or endpoint not available
    console.warn(`[Google Classroom] invitations.list non-fatal check:`, invErr);
  }

  // 3. Fallback direct REST check if map is empty
  if (studentMap.size === 0) {
    try {
      console.log(`[Google Classroom] Trying direct REST API fallback for course ${courseId}...`);
      const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/students?pageSize=100`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        const raw = (data.students as Array<{
          userId?: string;
          profile?: {
            id?: string;
            emailAddress?: string;
            name?: { fullName?: string; givenName?: string; familyName?: string };
          };
        }>) || [];
        console.log(`[Google Classroom] Direct REST returned ${raw.length} students`);
        raw.forEach((s, idx) => {
          const userId = s.userId || s.profile?.id || `student_${idx + 1}`;
          const fullName =
            s.profile?.name?.fullName ||
            [s.profile?.name?.givenName, s.profile?.name?.familyName].filter(Boolean).join(' ') ||
            `Student ${idx + 1}`;
          studentMap.set(userId, {
            id: userId,
            name: fullName,
            email: s.profile?.emailAddress || ''
          });
        });
      } else {
        const errorText = await res.text();
        console.error(`[Google Classroom] Direct REST error ${res.status}:`, errorText);
      }
    } catch (fallbackErr) {
      console.error('[Google Classroom] Direct REST error:', fallbackErr);
    }
  }

  const result = Array.from(studentMap.values());
  console.log(`[Google Classroom] Total roster resolved: ${result.length} student(s)`);
  return result;
}

export interface CreateCourseWorkInput {
  courseId: string;
  title: string;
  description: string;
  linkUrl: string;
  studentIds?: string[];
  maxPoints?: number;
}

export interface CreateCourseWorkResult {
  id?: string;
  alternateLink?: string;
}

/**
 * Creates and publishes a CourseWork assignment in a Google Classroom course,
 * assigned specifically to individual checked students if IDs are provided.
 */
export async function createCourseWorkAssignment(
  accessToken: string,
  input: CreateCourseWorkInput
): Promise<CreateCourseWorkResult> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const classroom = google.classroom({ version: 'v1', auth });

  // Filter valid Google student user IDs (exclude fallback placeholders)
  const validStudentIds = (input.studentIds || []).filter(
    (id) => id && !id.startsWith('student_') && !id.startsWith('invitee_')
  );

  const requestBody: {
    title: string;
    description: string;
    materials: Array<{ link: { url: string; title: string } }>;
    state: 'PUBLISHED' | 'DRAFT';
    workType: 'ASSIGNMENT';
    maxPoints: number;
    assigneeMode?: 'ALL_STUDENTS' | 'INDIVIDUAL_STUDENTS';
    individualStudentsOptions?: { studentIds: string[] };
  } = {
    title: input.title,
    description: input.description,
    materials: [
      {
        link: {
          url: input.linkUrl,
          title: `Start Exam - ${input.title}`
        }
      }
    ],
    state: 'PUBLISHED',
    workType: 'ASSIGNMENT',
    maxPoints: input.maxPoints || 100
  };

  if (validStudentIds.length > 0) {
    requestBody.assigneeMode = 'INDIVIDUAL_STUDENTS';
    requestBody.individualStudentsOptions = {
      studentIds: validStudentIds
    };
  } else {
    requestBody.assigneeMode = 'ALL_STUDENTS';
  }

  console.log(`[Google Classroom] Publishing CourseWork assignment to course ${input.courseId} (${requestBody.assigneeMode})...`);
  const response = await classroom.courses.courseWork.create({
    courseId: input.courseId,
    requestBody
  });

  console.log(`[Google Classroom] CourseWork created with ID: ${response.data.id}`);
  return {
    id: response.data.id || undefined,
    alternateLink: response.data.alternateLink || undefined
  };
}

export interface StudentPublishItem {
  id: string; // studentExamId
  name: string;
  email?: string | null;
  googleUserId?: string | null;
  accessCode: string;
  accessToken: string;
  maxPoints?: number;
}

export interface PublishIndividualAssignmentsInput {
  courseId: string;
  examTitle: string;
  examSubject: string;
  durationMinutes: number;
  questionCount: number;
  maxPoints?: number;
  students: StudentPublishItem[];
}

export interface PublishIndividualAssignmentsResult {
  published: Array<{ studentExamId: string; studentName: string; courseWorkId: string; alternateLink?: string }>;
  errors: Array<{ studentExamId: string; studentName: string; error: string }>;
}

/**
 * Creates an individual, private CourseWork assignment for each student in the course.
 * Each student will ONLY see their own assignment containing their unique code and link.
 */
export async function publishIndividualStudentAssignments(
  accessToken: string,
  input: PublishIndividualAssignmentsInput
): Promise<PublishIndividualAssignmentsResult> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const classroom = google.classroom({ version: 'v1', auth });

  const published: PublishIndividualAssignmentsResult['published'] = [];
  const errors: PublishIndividualAssignmentsResult['errors'] = [];

  // If any student is missing googleUserId, fetch roster to resolve it by email or name
  const needsRosterResolve = input.students.some(
    (s) => !s.googleUserId || s.googleUserId.startsWith('student_') || s.googleUserId.startsWith('invitee_')
  );

  const rosterMap = new Map<string, string>(); // email -> googleUserId
  const rosterNameMap = new Map<string, string>(); // name -> googleUserId

  if (needsRosterResolve) {
    try {
      const roster = await fetchCourseRoster(accessToken, input.courseId);
      roster.forEach((r) => {
        if (r.id && !r.id.startsWith('student_') && !r.id.startsWith('invitee_')) {
          if (r.email) rosterMap.set(r.email.toLowerCase(), r.id);
          if (r.name) rosterNameMap.set(r.name.toLowerCase(), r.id);
        }
      });
    } catch (err) {
      console.warn('[Google Classroom] Could not fetch roster for ID resolution:', err);
    }
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    'http://localhost:3000';

  for (const st of input.students) {
    let resolvedUserId = st.googleUserId;
    if (!resolvedUserId || resolvedUserId.startsWith('student_') || resolvedUserId.startsWith('invitee_')) {
      if (st.email && rosterMap.has(st.email.toLowerCase())) {
        resolvedUserId = rosterMap.get(st.email.toLowerCase());
      } else if (rosterNameMap.has(st.name.toLowerCase())) {
        resolvedUserId = rosterNameMap.get(st.name.toLowerCase());
      }
    }

    if (!resolvedUserId) {
      console.warn(`[Google Classroom] Skipping student ${st.name}: No valid Google user ID found.`);
      errors.push({
        studentExamId: st.id,
        studentName: st.name,
        error: 'No matching Google Classroom account ID found for this student.'
      });
      continue;
    }

    const studentDirectLink = `${baseUrl}/exam/${st.accessToken}`;

    try {
      console.log(`[Google Classroom] Posting individual assignment for ${st.name} (User ID: ${resolvedUserId})...`);
      const response = await classroom.courses.courseWork.create({
        courseId: input.courseId,
        requestBody: {
          title: `${input.examTitle} - ${st.name}`,
          description: `AegisExam AI Assessment Room\n\nExaminee: ${st.name}\nYour Unique 6-Digit Access Code: ${st.accessCode}\nYour Direct Exam Room Link:\n${studentDirectLink}\n\nInstructions: Click your direct exam link above or navigate to ${baseUrl} and enter your access code. Only you have access to this personalized exam variant. Do not share your code or switch tabs during the exam.\n\nDuration: ${input.durationMinutes} minutes | Questions: ${input.questionCount}`,
          materials: [
            {
              link: {
                url: studentDirectLink,
                title: `Start Personalized Exam (${st.name})`
              }
            }
          ],
          state: 'PUBLISHED',
          workType: 'ASSIGNMENT',
          maxPoints: st.maxPoints || input.maxPoints || (input.questionCount * 10),
          assigneeMode: 'INDIVIDUAL_STUDENTS',
          individualStudentsOptions: {
            studentIds: [resolvedUserId]
          }
        }
      });

      published.push({
        studentExamId: st.id,
        studentName: st.name,
        courseWorkId: response.data.id || '',
        alternateLink: response.data.alternateLink || undefined
      });
      console.log(`[Google Classroom] Successfully posted for ${st.name} (CW ID: ${response.data.id})`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Google Classroom] Failed to post assignment for ${st.name}:`, errMsg);
      errors.push({
        studentExamId: st.id,
        studentName: st.name,
        error: errMsg
      });
    }
  }

  return { published, errors };
}

/**
 * Deletes a single CourseWork assignment from a Google Classroom course.
 */
export async function deleteCourseWorkAssignment(
  accessToken: string,
  courseId: string,
  courseWorkId: string
): Promise<boolean> {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const classroom = google.classroom({ version: 'v1', auth });

    await classroom.courses.courseWork.delete({
      courseId,
      id: courseWorkId
    });
    console.log(`[Google Classroom] Successfully deleted CourseWork ${courseWorkId} from course ${courseId}`);
    return true;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[Google Classroom] Could not delete CourseWork ${courseWorkId} (may already be removed):`, errMsg);
    return false;
  }
}

/**
 * Deletes all coursework assignments associated with an exam from Google Classroom.
 */
export async function deleteExamClassroomAssignments(
  accessToken: string,
  courseId: string,
  courseWorkIds: string[]
): Promise<{ deletedCount: number; errors: string[] }> {
  let deletedCount = 0;
  const errors: string[] = [];
  const uniqueIds = Array.from(new Set(courseWorkIds.filter((id): id is string => Boolean(id))));

  for (const id of uniqueIds) {
    try {
      const ok = await deleteCourseWorkAssignment(accessToken, courseId, id);
      if (ok) {
        deletedCount++;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(errMsg);
    }
  }

  return { deletedCount, errors };
}

export interface ReleaseGradesItem {
  studentName: string;
  courseWorkId?: string | null;
  totalScore: number;
  maxScore?: number;
}

export interface ReleaseGradesInput {
  courseId: string;
  grades: ReleaseGradesItem[];
}

export interface ReleaseGradesResult {
  releasedCount: number;
  errors: Array<{ studentName: string; error: string }>;
}

/**
 * Syncs and releases student examination scores into Google Classroom.
 * Updates assignedGrade and draftGrade, then returns submissions to publish grades.
 */
export async function releaseStudentGradesToClassroom(
  accessToken: string,
  input: ReleaseGradesInput
): Promise<ReleaseGradesResult> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const classroom = google.classroom({ version: 'v1', auth });

  let releasedCount = 0;
  const errors: ReleaseGradesResult['errors'] = [];

  for (const item of input.grades) {
    if (!item.courseWorkId) {
      errors.push({
        studentName: item.studentName,
        error: 'No Google Classroom coursework ID associated with this student.'
      });
      continue;
    }

    try {
      const submissionsRes = await classroom.courses.courseWork.studentSubmissions.list({
        courseId: input.courseId,
        courseWorkId: item.courseWorkId
      });

      const submissions = submissionsRes.data.studentSubmissions || [];
      if (submissions.length === 0) {
        errors.push({
          studentName: item.studentName,
          error: 'No student submission found in Google Classroom.'
        });
        continue;
      }

      for (const sub of submissions) {
        if (!sub.id) continue;

        const normalizedScore = Math.round(item.totalScore * 10) / 10;

        await classroom.courses.courseWork.studentSubmissions.patch({
          courseId: input.courseId,
          courseWorkId: item.courseWorkId,
          id: sub.id,
          updateMask: 'assignedGrade,draftGrade',
          requestBody: {
            assignedGrade: normalizedScore,
            draftGrade: normalizedScore
          }
        });

        // Attempt to return the submission so the student sees their grade published
        try {
          await classroom.courses.courseWork.studentSubmissions.return({
            courseId: input.courseId,
            courseWorkId: item.courseWorkId,
            id: sub.id,
            requestBody: {}
          });
        } catch (returnErr) {
          console.warn(`[Google Classroom] Grade saved in draft, return notice for ${item.studentName}:`, returnErr);
        }

        releasedCount++;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Google Classroom] Failed to release grade for ${item.studentName}:`, errMsg);
      errors.push({
        studentName: item.studentName,
        error: errMsg
      });
    }
  }

  return { releasedCount, errors };
}

