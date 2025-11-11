-- Migration: Add AI Chat History
-- Description: Create table to store AI chat conversations and history
-- Author: Claude
-- Date: 2025-11-11

-- Create ai_chat_sessions table
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_chat_session FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create ai_chat_messages table
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_session_message FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_session_id ON ai_chat_sessions(session_id);
CREATE INDEX idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);

-- Create trigger to update updated_at on ai_chat_sessions
CREATE OR REPLACE FUNCTION update_ai_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_chat_sessions_updated_at
BEFORE UPDATE ON ai_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_ai_chat_sessions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE ai_chat_sessions IS 'Stores AI chat conversation sessions for users';
COMMENT ON TABLE ai_chat_messages IS 'Stores individual messages in AI chat conversations';
COMMENT ON COLUMN ai_chat_sessions.context IS 'JSON field storing user personality test results and other context for personalized AI responses';
COMMENT ON COLUMN ai_chat_messages.metadata IS 'JSON field for storing additional message metadata (tokens used, model version, etc.)';
