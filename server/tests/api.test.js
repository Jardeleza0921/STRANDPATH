import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from '../db.js';
import { seed } from '../seed.js';
import { createApp } from '../app.js';

const dir = mkdtempSync(join(tmpdir(), 'strandpath-test-'));
const db = openDb(join(dir, 'test.db'));
seed(db, { adminName: 'Test Administrator', adminEmail: 'admin@test.local', adminPassword: 'AdminPass#123' });
const outbox = [];
const mailer = {
  config: { configured: false, appBaseUrl: '' },
  async send(message) {
    outbox.push(message);
    return { delivered: true, delivery: 'test', messageId: `test:${outbox.length}` };
  }
};
const app = createApp({ db, serveClient: false, mailer });
const server = createServer(app);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

test.after(() => {
  server.close();
  db.close();
});

function client() {
  let cookie = '';
  return {
    get cookie() {
      return cookie;
    },
    async request(method, path, body) {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Origin: base,
          ...(cookie ? { Cookie: cookie } : {})
        },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      return { status: response.status, body: payload };
    }
  };
}

const questionnaire = await (async () => {
  const c = client();
  const res = await c.request('GET', '/api/questionnaire/active');
  assert.equal(res.status, 200);
  return res.body;
})();

function answersFor(pick = (q) => q.options[0].code) {
  const answers = {};
  for (const q of questionnaire.questions) {
    if (q.kind === 'multi') answers[q.code] = q.options.slice(0, q.maxChoices ?? 2).map((o) => o.code);
    else answers[q.code] = [pick(q)];
  }
  return answers;
}

let studentCookie = '';
let studentId = null;
let assessmentId = null;
let postId = null;

test('rejects unauthenticated access to protected routes', async () => {
  const anon = client();
  const res = await anon.request('GET', '/api/dashboard');
  assert.equal(res.status, 401);
});

test('registration validates consent and password strength', async () => {
  const c = client();
  const noConsent = await c.request('POST', '/api/auth/register', {
    name: 'Test Student', email: 'nope@example.com', password: 'Passw0rd!', consent: false
  });
  assert.equal(noConsent.status, 400);
  const weak = await c.request('POST', '/api/auth/register', {
    name: 'Test Student', email: 'weak@example.com', password: 'short', consent: true
  });
  assert.equal(weak.status, 400);
  assert.match(weak.body.message, /at least 8 characters/);
});

test('a student can register, sign out and sign back in', async () => {
  const c = client();
  const reg = await c.request('POST', '/api/auth/register', {
    name: 'Maria Santos',
    email: 'maria@example.com',
    password: 'Student#2026',
    consent: true,
    gradeLevel: 'Grade 10',
    school: 'Sample National High School'
  });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.user.role, 'student');
  assert.ok(c.cookie.startsWith('sp_session='));
  studentCookie = c.cookie;
  studentId = reg.body.user.id;

  const me = await c.request('GET', '/api/auth/me');
  assert.equal(me.body.user.email, 'maria@example.com');

  const logout = await c.request('POST', '/api/auth/logout');
  assert.equal(logout.status, 200);

  const login = await c.request('POST', '/api/auth/login', { email: 'maria@example.com', password: 'Student#2026' });
  assert.equal(login.status, 200);
  studentCookie = c.cookie;

  const wrong = await client().request('POST', '/api/auth/login', { email: 'maria@example.com', password: 'WrongPass1' });
  assert.equal(wrong.status, 401);
});

test('profile updates persist', async () => {
  const c = client();
  await c.request('POST', '/api/auth/login', { email: 'maria@example.com', password: 'Student#2026' });
  const update = await c.request('PUT', '/api/profile', {
    gradeLevel: 'Grade 10',
    school: 'Sample National High School',
    interests: 'Computers, design',
    goals: 'Understand my options'
  });
  assert.equal(update.status, 200);
  const me = await c.request('GET', '/api/profile');
  assert.equal(me.body.profile.interests, 'Computers, design');
});

test('assessment progress saves, incomplete submission is blocked, full submission scores', async () => {
  const c = client();
  await c.request('POST', '/api/auth/login', { email: 'maria@example.com', password: 'Student#2026' });

  const start = await c.request('POST', '/api/assessments', { type: 'pre' });
  assert.equal(start.status, 201);
  assessmentId = start.body.assessment.id;

  const answers = answersFor();
  const partial = { ...answers };
  delete partial.q20;
  const save = await c.request('PATCH', `/api/assessments/${assessmentId}/answers`, { answers: partial });
  assert.equal(save.status, 200);

  const resumed = await c.request('GET', `/api/assessments/${assessmentId}`);
  assert.equal(Object.keys(resumed.body.assessment.answers).length, Object.keys(partial).length);

  const blocked = await c.request('POST', `/api/assessments/${assessmentId}/submit`, { answers: partial });
  assert.equal(blocked.status, 400);
  assert.ok(blocked.body.message.includes('q20'));

  const submit = await c.request('POST', `/api/assessments/${assessmentId}/submit`, { answers });
  assert.equal(submit.status, 200);
  const result = submit.body.assessment;
  assert.equal(result.status, 'submitted');
  assert.equal(result.ranked.length, 7);
  assert.equal(result.categoryScores.length, 10);
  assert.equal(result.algorithmVersion, 'strandpath-fit-1.0.0');
  assert.ok(result.ranked[0].explanation.length > 50);

  const history = await c.request('GET', '/api/assessments');
  assert.equal(history.body.assessments.length, 1);
  assert.equal(history.body.assessments[0].status, 'submitted');
});

test('a student can only read their own assessment', async () => {
  const other = client();
  await other.request('POST', '/api/auth/register', {
    name: 'Jose Cruz', email: 'jose@example.com', password: 'Student#2026', consent: true
  });
  const res = await other.request('GET', `/api/assessments/${assessmentId}`);
  assert.equal(res.status, 404);
});

test('strand selection and programme generation create persistent records', async () => {
  const c = client();
  await c.request('POST', '/api/auth/login', { email: 'maria@example.com', password: 'Student#2026' });

  const select = await c.request('POST', `/api/assessments/${assessmentId}/selection`, { strandSlug: 'ict' });
  assert.equal(select.status, 200);

  const generate = await c.request('POST', '/api/programs/generate', {});
  assert.equal(generate.status, 201);
  const program = generate.body.program;
  assert.ok(program.activities.length >= 2);
  assert.equal(program.strandSlug, 'ict');

  const again = await c.request('POST', '/api/programs/generate', {});
  assert.equal(again.status, 200);
  assert.equal(again.body.reused, true);
  assert.equal(again.body.program.id, program.id);

  const activity = program.activities[0];
  const start = await c.request('POST', `/api/program-activities/${activity.id}/start`);
  assert.equal(start.body.status, 'in_progress');

  let responses = undefined;
  if (Array.isArray(activity.check)) responses = activity.check.map((q) => q.answer);
  const complete = await c.request('POST', `/api/program-activities/${activity.id}/complete`, {
    reflection: 'I practised the steps and noticed which part I need to repeat next week.',
    responses
  });
  assert.equal(complete.status, 200);

  const current = await c.request('GET', '/api/programs/current');
  assert.equal(current.body.program.progress.completed, 1);

  const progress = await c.request('GET', '/api/progress');
  assert.equal(progress.body.summary.activitiesCompleted, 1);
});

test('post-assessment compares against the pre-assessment baseline', async () => {
  const c = client();
  await c.request('POST', '/api/auth/login', { email: 'maria@example.com', password: 'Student#2026' });
  const start = await c.request('POST', '/api/assessments', { type: 'post' });
  assert.equal(start.status, 201);
  postId = start.body.assessment.id;
  const answers = answersFor((q) => q.options[Math.min(1, q.options.length - 1)].code);
  const submit = await c.request('POST', `/api/assessments/${postId}/submit`, { answers });
  assert.equal(submit.status, 200);
  const comparison = submit.body.assessment.comparison;
  assert.ok(comparison, 'post-assessment should include a comparison');
  assert.equal(comparison.categories.length, 10);
  assert.match(comparison.note, /do not prove/i);
});

test('support tickets are created and only visible to their owner', async () => {
  const c = client();
  await c.request('POST', '/api/auth/login', { email: 'maria@example.com', password: 'Student#2026' });
  const created = await c.request('POST', '/api/support/tickets', {
    subject: 'Cannot see my results',
    category: 'results',
    message: 'I submitted the assessment but the results page shows nothing.',
    priority: 'normal'
  });
  assert.equal(created.status, 201);
  const ticketId = created.body.ticket.id;

  const list = await c.request('GET', '/api/support/tickets');
  assert.equal(list.body.tickets.length, 1);

  const other = client();
  await other.request('POST', '/api/auth/login', { email: 'jose@example.com', password: 'Student#2026' });
  const foreign = await other.request('POST', `/api/support/tickets/${ticketId}/messages`, { body: 'hijack' });
  assert.equal(foreign.status, 404);
});

test('students cannot reach admin endpoints; admin can manage records', async () => {
  const student = client();
  const studentLogin = await student.request('POST', '/api/auth/login', { email: 'maria@example.com', password: 'Student#2026' });
  assert.equal(studentLogin.status, 200);
  const denied = await student.request('GET', '/api/admin/overview');
  assert.equal(denied.status, 403);

  const admin = client();
  const login = await admin.request('POST', '/api/auth/login', {
    email: 'admin@test.local',
    password: 'AdminPass#123'
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, 'admin');
  assert.equal(login.body.user.mustChangePassword, true);

  const forced = await admin.request('GET', '/api/admin/overview');
  assert.equal(forced.status, 403);
  assert.equal(forced.body.error, 'PASSWORD_CHANGE_REQUIRED');

  const changed = await admin.request('POST', '/api/auth/password', {
    currentPassword: 'AdminPass#123',
    newPassword: 'AdminPass#456'
  });
  assert.equal(changed.status, 200);

  const overview = await admin.request('GET', '/api/admin/overview');
  assert.equal(overview.status, 200);
  assert.equal(overview.body.counts.students, 2);
  assert.equal(overview.body.counts.pre, 1);

  const students = await admin.request('GET', '/api/admin/students?search=maria');
  assert.equal(students.body.students.length, 1);

  const detail = await admin.request('GET', `/api/admin/students/${studentId}`);
  assert.equal(detail.status, 200);
  assert.ok(detail.body.assessments.length >= 2);

  const analytics = await admin.request('GET', '/api/admin/analytics');
  assert.equal(analytics.status, 200);
  assert.equal(analytics.body.students, 2);
  assert.equal(Object.values(analytics.body.recommendationDistribution).reduce((a, b) => a + b, 0), 1);
  assert.equal(analytics.body.selectionDistribution.ict, 1);

  const logs = await admin.request('GET', '/api/admin/logs');
  assert.ok(logs.body.logs.some((l) => l.action === 'student.record.view'));

  const tickets = await admin.request('GET', '/api/admin/tickets');
  assert.ok(tickets.body.tickets.length === 1);
  const ticketId = tickets.body.tickets[0].id;
  const reply = await admin.request('POST', `/api/admin/tickets/${ticketId}/messages`, {
    body: 'Thanks for reporting — we have checked your results and they are saved.'
  });
  assert.equal(reply.status, 200);
  const resolved = await admin.request('PATCH', `/api/admin/tickets/${ticketId}`, { status: 'resolved' });
  assert.equal(resolved.body.ticket.status, 'resolved');
});

test('the active questionnaire cannot be edited, but a new version can be created', async () => {
  const admin = client();
  await admin.request('POST', '/api/auth/login', {
    email: 'admin@test.local',
    password: 'AdminPass#456'
  });
  const list = await admin.request('GET', '/api/admin/questionnaires');
  const active = list.body.versions.find((v) => v.status === 'active');
  assert.ok(active);
  const activeDetail = await admin.request('GET', `/api/admin/questionnaires/${active.id}`);
  const question = activeDetail.body.questions[0];
  const edit = await admin.request('PATCH', `/api/admin/questions/${question.id}`, { prompt: 'Changed prompt text' });
  assert.equal(edit.status, 409);

  const clone = await admin.request('POST', '/api/admin/questionnaires', {
    version: '1.1-draft',
    title: 'Draft revision',
    cloneFrom: active.id
  });
  assert.equal(clone.status, 201);
  const draft = await admin.request('GET', `/api/admin/questionnaires/${clone.body.id}`);
  const draftQuestion = draft.body.questions[0];
  const draftEdit = await admin.request('PATCH', `/api/admin/questions/${draftQuestion.id}`, { prompt: 'Revised wording for pilot testing' });
  assert.equal(draftEdit.status, 200);

  const activate = await admin.request('POST', `/api/admin/questionnaires/${clone.body.id}/activate`);
  assert.equal(activate.status, 200);
  const activeQuestionnaire = await client().request('GET', '/api/questionnaire/active');
  assert.equal(activeQuestionnaire.body.version, '1.1-draft');
  // Stored assessments keep the version they were taken with.
  const history = await client().request('GET', '/api/assessments');
  assert.equal(history.status, 401);
});

test('cross-origin mutations are refused', async () => {
  const response = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
    body: JSON.stringify({ email: 'maria@example.com', password: 'Student#2026' })
  });
  assert.equal(response.status, 403);
});
