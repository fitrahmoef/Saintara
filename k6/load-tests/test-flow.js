import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const testDuration = new Trend('test_duration');

export const options = {
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  let token;

  // Login
  group('Authentication', function () {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: 'admin@saintara.com',
        password: 'admin123',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(res, {
      'login successful': (r) => r.status === 200,
    }) || errorRate.add(1);

    if (res.status === 200) {
      token = JSON.parse(res.body).token;
    }
  });

  if (!token) return;

  // Get dashboard data
  group('Dashboard', function () {
    const res = http.get(`${BASE_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    check(res, {
      'dashboard loaded': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  // Get test list
  group('Tests', function () {
    const res = http.get(`${BASE_URL}/api/tests`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    check(res, {
      'tests loaded': (r) => r.status === 200,
      'has tests': (r) => JSON.parse(r.body).length > 0,
    }) || errorRate.add(1);
  });

  sleep(2);
}
