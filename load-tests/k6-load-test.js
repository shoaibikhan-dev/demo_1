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
    http_req_duration: ['p(95)<500'],
  },
  insecureSkipTLSVerify: true,
};

export default function () {
  const res = http.get('https://mardan.local/api/health');
  check(res, {
    'is status 200': (r) => r.status === 200,
    'uptime is returned': (r) => r.json('status') === 'OK',
  });
  sleep(1);
}
