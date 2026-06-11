const request = require('supertest');
const app     = require('../server');

describe('Health Endpoints', () => {
  afterAll(async () => {
    // Close server after tests
    if (app.close) app.close();
  });

  test('GET /api/health returns 200 and status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('GET /api/health/ready returns 200 or 503', async () => {
    const res = await request(app).get('/api/health/ready');
    expect([200, 503]).toContain(res.statusCode);
  });
});

describe('Auth Endpoints', () => {
  test('POST /api/v1/auth/login with missing fields returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/v1/auth/register with invalid CNIC returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: '123456', cnic: '12345' });
    expect(res.statusCode).toBe(400);
  });
});
