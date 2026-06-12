import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 500 },
    { duration: '1m', target: 2000 },
    { duration: '30s', target: 5000 },
    { duration: '1m', target: 5000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://192.168.100.224:31724';
const HOST = 'mardan.local';

export function setup() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'testuser@mardan.gov.pk', password: 'Test@1234' }),
    { headers: { 'Content-Type': 'application/json', 'Host': HOST } }
  );
  const setCookie = res.headers['Set-Cookie'] || '';
  const match = setCookie.match(/msc_token=([^;]+)/);
  return { token: match ? match[1] : '' };
}

export default function (data) {
  const token = data.token;
  if (!token) return;

  const complaintsRes = http.get(
    `${BASE_URL}/api/v1/complaints/my`,
    {
      headers: {
        'Host': HOST,
        'Cookie': `msc_token=${token}`,
      },
    }
  );

  check(complaintsRes, {
    'complaints status 200': (r) => r.status === 200,
  });

  sleep(0.05);
}
