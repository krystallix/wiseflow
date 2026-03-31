-- ==============================================================================
-- CHAT HISTORY SCHEMA (HARD DELETE VERSION)
-- ==============================================================================

-- 1. Create Enum for Chat Roles (if not exists)
DO $$ BEGIN
    CREATE TYPE chat_role AS ENUM ('user', 'assistant', 'system', 'tool');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Chat Sessions Table
CREATE TABLE IF NOT EXISTS risenwise.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Chat Messages Table
CREATE TABLE IF NOT EXISTS risenwise.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES risenwise.chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role chat_role NOT NULL DEFAULT 'user',
    content TEXT NOT NULL,
    
    -- Ordering
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON risenwise.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON risenwise.chat_messages(session_id);

-- ==============================================================================
-- TRIGGERS (Auto-update updated_at)
-- ==============================================================================

-- Assume handle_updated_at() exists. If not:
-- CREATE OR REPLACE FUNCTION handle_updated_at() RETURNS TRIGGER AS $$ 
-- BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON risenwise.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON risenwise.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON risenwise.chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON risenwise.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE risenwise.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risenwise.chat_messages ENABLE ROW LEVEL SECURITY;

-- Clean up old policies if they exist (prevents conflict)
DROP POLICY IF EXISTS "Users can fully manage their own chat sessions" ON risenwise.chat_sessions;
DROP POLICY IF EXISTS "Users can fully manage their own chat messages" ON risenwise.chat_messages;

-- ------------------------------------------------------------------------------
-- Simple Policies for `chat_sessions`
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can fully manage their own chat sessions"
ON risenwise.chat_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Simple Policies for `chat_messages`
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can fully manage their own chat messages"
ON risenwise.chat_messages
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
