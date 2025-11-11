import request from 'supertest';
import express, { Express } from 'express';
import aiChatRoutes from '../src/routes/ai-chat.routes';
import { authenticateToken } from '../src/middleware/auth.middleware';

// Mock the database
jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'This is a test AI response',
                role: 'assistant',
              },
              finish_reason: 'stop',
            }],
            model: 'gpt-4o-mini',
            usage: { total_tokens: 100 },
          }),
        },
      },
    })),
  };
});

// Mock the auth middleware
jest.mock('../src/middleware/auth.middleware', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 1, email: 'test@example.com' };
    next();
  }),
}));

describe('AI Chat Routes', () => {
  let app: Express;
  const pool = require('../src/config/database').default;

  beforeAll(() => {
    // Set OpenAI API key for tests
    process.env.OPENAI_API_KEY = 'sk-test-key';

    app = express();
    app.use(express.json());
    app.use('/api/ai-chat', aiChatRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ai-chat/session', () => {
    it('should create a new chat session when no active session exists', async () => {
      // Mock no existing session
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing session
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            session_id: 'session_123',
            title: 'New Conversation',
            created_at: new Date()
          }]
        }) // Insert new session
        .mockResolvedValueOnce({ rows: [] }) // Insert system message
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            role: 'assistant',
            content: 'Hello! How can I help?',
            created_at: new Date()
          }]
        }); // Insert welcome message

      const response = await request(app)
        .post('/api/ai-chat/session')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.session_id).toBeDefined();
    });

    it('should return existing session if one exists', async () => {
      const mockSession = {
        id: 1,
        session_id: 'session_existing_123',
        title: 'Existing Conversation',
        created_at: new Date(),
      };

      pool.query
        .mockResolvedValueOnce({ rows: [mockSession] }) // Existing session
        .mockResolvedValueOnce({ rows: [] }); // Messages

      const response = await request(app)
        .post('/api/ai-chat/session')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.session_id).toBe(mockSession.session_id);
    });

    it('should require authentication', async () => {
      // Override the mock to simulate no authentication
      (authenticateToken as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = undefined;
        next();
      });

      const response = await request(app)
        .post('/api/ai-chat/session');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/ai-chat/message', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/ai-chat/message')
        .set('Authorization', 'Bearer test-token')
        .send({
          // Missing session_id and message
        });

      expect(response.status).toBe(400);
    });

    it('should validate message length', async () => {
      const longMessage = 'a'.repeat(2001);

      const response = await request(app)
        .post('/api/ai-chat/message')
        .set('Authorization', 'Bearer test-token')
        .send({
          session_id: 'session_123',
          message: longMessage,
        });

      expect(response.status).toBe(400);
    });

    it('should send message and receive AI response', async () => {
      const mockSession = {
        id: 1,
        context: {},
      };

      pool.query
        .mockResolvedValueOnce({ rows: [mockSession] }) // Verify session
        .mockResolvedValueOnce({ rows: [] }) // Save user message
        .mockResolvedValueOnce({
          rows: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Hello' }
          ]
        }) // Get conversation history
        .mockResolvedValueOnce({
          rows: [{
            id: 2,
            role: 'assistant',
            content: 'This is a test AI response',
            created_at: new Date()
          }]
        }); // Save AI response

      const response = await request(app)
        .post('/api/ai-chat/message')
        .set('Authorization', 'Bearer test-token')
        .send({
          session_id: 'session_123',
          message: 'Hello',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.message).toBeDefined();
    });

    it('should return 404 if session not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // No session found

      const response = await request(app)
        .post('/api/ai-chat/message')
        .set('Authorization', 'Bearer test-token')
        .send({
          session_id: 'invalid_session',
          message: 'Hello',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/ai-chat/sessions', () => {
    it('should return list of user sessions', async () => {
      const mockSessions = [
        {
          session_id: 'session_1',
          title: 'Chat 1',
          created_at: new Date(),
          updated_at: new Date(),
          message_count: '5',
        },
        {
          session_id: 'session_2',
          title: 'Chat 2',
          created_at: new Date(),
          updated_at: new Date(),
          message_count: '3',
        },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockSessions });

      const response = await request(app)
        .get('/api/ai-chat/sessions')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/ai-chat/history/:session_id', () => {
    it('should return chat history for a session', async () => {
      const mockSession = {
        id: 1,
        title: 'Test Chat',
        created_at: new Date(),
      };

      const mockMessages = [
        { id: 1, role: 'user', content: 'Hello', created_at: new Date() },
        { id: 2, role: 'assistant', content: 'Hi there!', created_at: new Date() },
      ];

      pool.query
        .mockResolvedValueOnce({ rows: [mockSession] }) // Verify session
        .mockResolvedValueOnce({ rows: mockMessages }); // Get messages

      const response = await request(app)
        .get('/api/ai-chat/history/session_123')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.messages).toHaveLength(2);
    });

    it('should return 404 if session not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // No session found

      const response = await request(app)
        .get('/api/ai-chat/history/invalid_session')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/ai-chat/session/:session_id', () => {
    it('should delete a chat session', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1 }]
      }); // Delete session

      const response = await request(app)
        .delete('/api/ai-chat/session/session_123')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 if session not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // No session found

      const response = await request(app)
        .delete('/api/ai-chat/session/invalid_session')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
    });
  });
});
