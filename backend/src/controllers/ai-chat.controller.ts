import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import pool from '../config/database';
import logger from '../config/logger';
import OpenAI from 'openai';

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  logger.info('✅ OpenAI client initialized successfully');
} else {
  logger.warn('⚠️  OpenAI API key not configured. AI Chat features will be unavailable.');
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get system prompt with user context
 */
async function getSystemPrompt(userId: number): Promise<string> {
  try {
    // Fetch user's latest personality test results
    const result = await pool.query(`
      SELECT
        tr.traits,
        ct.name as character_type,
        ct.description,
        ct.strengths,
        ct.challenges,
        u.name as user_name
      FROM test_results tr
      INNER JOIN users u ON tr.user_id = u.id
      LEFT JOIN character_types ct ON tr.character_type_id = ct.id
      WHERE tr.user_id = $1
      ORDER BY tr.created_at DESC
      LIMIT 1
    `, [userId]);

    if (result.rows.length > 0) {
      const data = result.rows[0];
      return `You are Saintara AI, a professional personality assessment consultant. You are helping ${data.user_name}.

USER PERSONALITY PROFILE:
- Character Type: ${data.character_type || 'Not yet determined'}
- Description: ${data.description || 'No description available'}
- Key Strengths: ${data.strengths || 'Not yet assessed'}
- Key Challenges: ${data.challenges || 'Not yet assessed'}
- Detailed Traits: ${data.traits ? JSON.stringify(data.traits) : 'Not yet available'}

YOUR ROLE:
- Provide personalized insights based on the user's personality profile
- Answer questions about their character type, strengths, and challenges
- Offer career guidance aligned with their personality traits
- Suggest personal development strategies
- Be empathetic, encouraging, and professional
- Keep responses concise (2-3 paragraphs max) unless asked for detailed analysis
- If the user hasn't taken a test yet, encourage them to take one for personalized insights

IMPORTANT:
- Always base advice on their actual test results when available
- Be supportive but honest about challenges they may face
- Encourage continuous growth and self-discovery
- Do not make medical or clinical diagnoses`;
    }

    // User hasn't taken any tests yet
    return `You are Saintara AI, a professional personality assessment consultant.

The user hasn't taken a personality test yet. Your role is to:
- Explain the benefits of personality assessments
- Answer general questions about personality types
- Encourage them to take a Saintara personality test
- Provide general self-discovery guidance
- Be empathetic, encouraging, and professional
- Keep responses concise (2-3 paragraphs max)

Remember: Once they complete a test, you'll be able to provide personalized insights based on their unique personality profile.`;
  } catch (error) {
    logger.error('Error fetching user context for AI chat:', error);
    return `You are Saintara AI, a professional personality assessment consultant.
            Provide helpful insights about personality types, career guidance, and personal development.
            Be empathetic, encouraging, and professional.`;
  }
}

/**
 * Create or get chat session
 */
export const createOrGetSession = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    // Check if user has an active session (created in last 24 hours)
    const existingSession = await pool.query(`
      SELECT id, session_id, title, created_at
      FROM ai_chat_sessions
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    if (existingSession.rows.length > 0) {
      // Return existing session
      const session = existingSession.rows[0];

      // Fetch messages for this session
      const messages = await pool.query(`
        SELECT id, role, content, created_at
        FROM ai_chat_messages
        WHERE session_id = $1
        ORDER BY created_at ASC
      `, [session.id]);

      return res.status(200).json({
        status: 'success',
        data: {
          session_id: session.session_id,
          title: session.title,
          messages: messages.rows,
        },
      });
    }

    // Create new session
    const sessionId = generateSessionId();
    const systemPrompt = await getSystemPrompt(userId);

    const newSession = await pool.query(`
      INSERT INTO ai_chat_sessions (user_id, session_id, title, context)
      VALUES ($1, $2, $3, $4)
      RETURNING id, session_id, title, created_at
    `, [userId, sessionId, 'New Conversation', JSON.stringify({ systemPrompt })]);

    // Add initial system message
    await pool.query(`
      INSERT INTO ai_chat_messages (session_id, role, content)
      VALUES ($1, $2, $3)
    `, [newSession.rows[0].id, 'system', systemPrompt]);

    // Add welcome message from assistant
    const welcomeMessage = await pool.query(`
      INSERT INTO ai_chat_messages (session_id, role, content)
      VALUES ($1, $2, $3)
      RETURNING id, role, content, created_at
    `, [
      newSession.rows[0].id,
      'assistant',
      "Hello! I'm your Saintara AI assistant. I can help you understand your personality type, career options, and personal development. How can I assist you today?"
    ]);

    res.status(201).json({
      status: 'success',
      data: {
        session_id: newSession.rows[0].session_id,
        title: newSession.rows[0].title,
        messages: [welcomeMessage.rows[0]],
      },
    });
  } catch (error) {
    logger.error('Error creating chat session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create chat session',
    });
  }
};

/**
 * Send message and get AI response
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array(),
      });
    }

    if (!openaiClient) {
      return res.status(503).json({
        status: 'error',
        message: 'AI Chat service is not configured. Please contact support.',
      });
    }

    const userId = req.user?.id;
    const { session_id, message } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    // Verify session belongs to user
    const sessionQuery = await pool.query(`
      SELECT id, context
      FROM ai_chat_sessions
      WHERE session_id = $1 AND user_id = $2
    `, [session_id, userId]);

    if (sessionQuery.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat session not found',
      });
    }

    const session = sessionQuery.rows[0];

    // Save user message
    await pool.query(`
      INSERT INTO ai_chat_messages (session_id, role, content)
      VALUES ($1, $2, $3)
    `, [session.id, 'user', message]);

    // Get conversation history (last 10 messages for context)
    const historyQuery = await pool.query(`
      SELECT role, content
      FROM ai_chat_messages
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [session.id]);

    // Reverse to get chronological order
    const conversationHistory = historyQuery.rows.reverse();

    // Call OpenAI API
    try {
      const completion = await openaiClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: conversationHistory.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        temperature: 0.7,
        max_tokens: 1000,
      });

      const aiResponse = completion.choices[0]?.message?.content ||
                         'I apologize, but I was unable to generate a response. Please try again.';

      // Save AI response
      const savedResponse = await pool.query(`
        INSERT INTO ai_chat_messages (session_id, role, content, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING id, role, content, created_at
      `, [
        session.id,
        'assistant',
        aiResponse,
        JSON.stringify({
          model: completion.model,
          tokens: completion.usage?.total_tokens || 0,
          finish_reason: completion.choices[0]?.finish_reason,
        }),
      ]);

      // Update session title if it's still "New Conversation"
      if (conversationHistory.length <= 3) {
        // Generate title from first user message (truncate to 50 chars)
        const title = message.length > 50
          ? message.substring(0, 47) + '...'
          : message;

        await pool.query(`
          UPDATE ai_chat_sessions
          SET title = $1
          WHERE id = $2
        `, [title, session.id]);
      }

      res.status(200).json({
        status: 'success',
        data: {
          message: savedResponse.rows[0],
        },
      });
    } catch (openaiError: any) {
      logger.error('OpenAI API error:', openaiError);

      // Return a friendly error message
      res.status(503).json({
        status: 'error',
        message: 'AI service is temporarily unavailable. Please try again later.',
        details: openaiError.message,
      });
    }
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message',
    });
  }
};

/**
 * Get chat history for a session
 */
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.params;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    // Verify session belongs to user
    const sessionQuery = await pool.query(`
      SELECT id, title, created_at
      FROM ai_chat_sessions
      WHERE session_id = $1 AND user_id = $2
    `, [session_id, userId]);

    if (sessionQuery.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat session not found',
      });
    }

    const session = sessionQuery.rows[0];

    // Get all messages (exclude system messages for cleaner UI)
    const messages = await pool.query(`
      SELECT id, role, content, created_at
      FROM ai_chat_messages
      WHERE session_id = $1 AND role != 'system'
      ORDER BY created_at ASC
    `, [session.id]);

    res.status(200).json({
      status: 'success',
      data: {
        session_id,
        title: session.title,
        created_at: session.created_at,
        messages: messages.rows,
      },
    });
  } catch (error) {
    logger.error('Error fetching chat history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch chat history',
    });
  }
};

/**
 * Get all chat sessions for user
 */
export const getUserSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    const sessions = await pool.query(`
      SELECT
        s.session_id,
        s.title,
        s.created_at,
        s.updated_at,
        COUNT(m.id) as message_count
      FROM ai_chat_sessions s
      LEFT JOIN ai_chat_messages m ON s.id = m.id AND m.role != 'system'
      WHERE s.user_id = $1
      GROUP BY s.id, s.session_id, s.title, s.created_at, s.updated_at
      ORDER BY s.updated_at DESC
      LIMIT 50
    `, [userId]);

    res.status(200).json({
      status: 'success',
      data: sessions.rows,
    });
  } catch (error) {
    logger.error('Error fetching user sessions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch chat sessions',
    });
  }
};

/**
 * Delete chat session
 */
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.params;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }

    // Delete session (messages will be cascade deleted)
    const result = await pool.query(`
      DELETE FROM ai_chat_sessions
      WHERE session_id = $1 AND user_id = $2
      RETURNING id
    `, [session_id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat session not found',
      });
    }

    logger.info(`Chat session deleted: ${session_id}`);

    res.status(200).json({
      status: 'success',
      message: 'Chat session deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting chat session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete chat session',
    });
  }
};
