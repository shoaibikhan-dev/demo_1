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
const BASE_URL = 'http://192.168.100.224:31724';
export default function () {
  const params = { headers: { 'Host': 'mardan.local' } };
  const res = http.get(`${BASE_URL}/api/health`, params);
  check(res, {
    'health status 200': (r) => r.status === 200,
    'health returns OK': (r) => r.json('status') === 'OK',
  });
  sleep(1);
}
