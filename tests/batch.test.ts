import request from 'supertest';
import mongoose from 'mongoose';

// Mock Redis/Bull avant tout import
jest.mock('../src/config/redis', () => ({
  createQueue: () => ({
    addBulk: jest.fn().mockResolvedValue([]),
    process: jest.fn(),
    on: jest.fn(),
    getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, failed: 0 }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
  isRedisAvailable: () => false,
  addToMemoryQueue: jest.fn(),
  getMemoryQueue: jest.fn().mockReturnValue([]),
  redisConfig: {},
}));

import app from '../src/app';

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/doc-generator-test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('POST /api/documents/batch', () => {
  it('should create a batch and return batchId', async () => {
    const res = await request(app)
      .post('/api/documents/batch')
      .send({ userIds: ['user-1', 'user-2', 'user-3'] });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.batchId).toBeDefined();
    expect(res.body.data.totalDocuments).toBe(3);
  });

  it('should return 400 for empty userIds', async () => {
    const res = await request(app)
      .post('/api/documents/batch')
      .send({ userIds: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for missing userIds', async () => {
    const res = await request(app)
      .post('/api/documents/batch')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/documents/batch/:batchId', () => {
  it('should return 404 for unknown batchId', async () => {
    const res = await request(app)
      .get('/api/documents/batch/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid batchId format', async () => {
    const res = await request(app)
      .get('/api/documents/batch/invalid-id');

    expect(res.status).toBe(400);
  });
});

describe('GET /health', () => {
  it('should return status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBeDefined();
    expect(res.body.services).toBeDefined();
  });
});