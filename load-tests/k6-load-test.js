import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '30s', target: 5000 },
    { duration: '1m', target: 5000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://192.168.100.188:31724';

export default function () {
  // Test 1: Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health returns OK': (r) => r.json('status') === 'OK',
  });

  sleep(0.5);

  // Test 2: Login (bcrypt + DB query)
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: 'admin@mardan.gov.pk',
      password: 'Admin@1234',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(loginRes, {
    'login status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'login response time < 2s': (r) => r.timings.duration < 2000,
  });

  const token = loginRes.status === 200 ? loginRes.json('token') : null;

  sleep(0.5);

  // Test 3: Get complaints (DB query + Redis cache)
  if (token) {
    const complaintsRes = http.get(`${BASE_URL}/api/v1/complaints`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    check(complaintsRes, {
      'complaints status 200': (r) => r.status === 200,
      'complaints response time < 1s': (r) => r.timings.duration < 1000,
    });

    sleep(0.5);

    // Test 4: Submit a complaint (DB write)
    const submitRes = http.post(
      `${BASE_URL}/api/v1/complaints`,
      JSON.stringify({
        title: 'Load Test Complaint',
        description: 'This is a load test complaint submission',
        category: 'Infrastructure',
        priority: 'medium',
        location: 'Mardan City Center',
      }),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    check(submitRes, {
      'complaint submit 201 or 200': (r) => r.status === 201 || r.status === 200,
      'complaint submit time < 2s': (r) => r.timings.duration < 2000,
    });
  }

  sleep(1);
}
