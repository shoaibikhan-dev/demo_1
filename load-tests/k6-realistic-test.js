import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend, Rate } from 'k6/metrics';

const loginDuration     = new Trend('login_duration', true);
const complaintDuration = new Trend('complaint_duration', true);
const listDuration      = new Trend('list_duration', true);
const loginFail         = new Rate('login_fail_rate');
const complaintFail     = new Rate('complaint_fail_rate');

export const options = {
  insecureSkipTLSVerify: true,
  stages: [
    { duration: '30s', target: 50  },
    { duration: '1m',  target: 150 },
    { duration: '1m',  target: 300 },
    { duration: '1m',  target: 500 },
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    http_req_duration:   ['p(95)<5000'],
    http_req_failed:     ['rate<0.10'],
    login_fail_rate:     ['rate<0.05'],
    complaint_fail_rate: ['rate<0.05'],
  },
};

const AUTH_URL      = 'http://localhost:31793';
const COMPLAINT_URL = 'http://localhost:30458';

const users = new SharedArray('users', function () {
  const arr = [];
  for (let i = 1; i <= 500; i++) {
    arr.push({ email: `user${i}@test.com`, password: 'Test@1234' });
  }
  return arr;
});

const categories = ['Roads & Infrastructure', 'Water Supply', 'Electricity', 'Sanitation', 'Parks'];
const priorities  = ['low', 'medium', 'high'];
const locations   = ['Mardan City', 'Takht Bhai', 'Katlang', 'Rustam', 'Shergarh'];

export default function () {
  const user = users[Math.floor(Math.random() * users.length)];

  // --- Login ---
  const t0       = Date.now();
  const loginRes = http.post(
    `${AUTH_URL}/api/v1/auth/login`,
    JSON.stringify({ email: user.email, password: 'Test@1234' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginDuration.add(Date.now() - t0);

  const loginOk = check(loginRes, { 'login 200': (r) => r.status === 200 });
  loginFail.add(!loginOk);
  if (!loginOk) { sleep(0.5); return; }

  const token = loginRes.cookies['msc_token']?.[0]?.value ?? '';
  if (!token)  { sleep(0.5); return; }

  const headers = { Cookie: `msc_token=${token}` };

  sleep(Math.random() * 0.3);

  // --- List complaints (70%) ---
  if (Math.random() < 0.7) {
    const t1      = Date.now();
    const listRes = http.get(`${COMPLAINT_URL}/api/v1/complaints/my`, { headers });
    listDuration.add(Date.now() - t1);
    check(listRes, { 'list 200': (r) => r.status === 200 });
    sleep(Math.random() * 0.2);
  }

  // --- Submit complaint (40%) ---
  if (Math.random() < 0.4) {
    const t2 = Date.now();
    const complaintRes = http.post(
      `${COMPLAINT_URL}/api/v1/complaints`,
      JSON.stringify({
        title:       `Issue ${Math.floor(Math.random() * 99999)}`,
        description: 'Stress test complaint.',
        category:    categories[Math.floor(Math.random() * categories.length)],
        priority:    priorities[Math.floor(Math.random() * priorities.length)],
        location:    locations[Math.floor(Math.random() * locations.length)],
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
    complaintDuration.add(Date.now() - t2);

    const ok = check(complaintRes, { 'submit 2xx': (r) => r.status < 300 });
    complaintFail.add(!ok);

    // --- Track submitted complaint dynamically (no hardcoded ID) ---
    if (ok && complaintRes.status === 201) {
      try {
        const body       = JSON.parse(complaintRes.body);
        const trackingId = body.trackingId || body.tracking_id || body.id;
        if (trackingId) {
          const trackRes = http.get(
            `${COMPLAINT_URL}/api/v1/complaints/track/${trackingId}`,
            { headers }
          );
          check(trackRes, { 'track 200': (r) => r.status === 200 });
        }
      } catch (_) {}
    }

    sleep(Math.random() * 0.2);
  }

  sleep(Math.random() * 0.3);
}
