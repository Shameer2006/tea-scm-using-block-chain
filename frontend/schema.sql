-- Supabase SQL Schema for Tea Supply Chain

-- Stakeholder Profiles Table
CREATE TABLE IF NOT EXISTS stakeholder_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  established TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Conversations Table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id TEXT PRIMARY KEY,
  participant1 TEXT NOT NULL,
  participant2 TEXT NOT NULL,
  product_info JSONB,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_address TEXT NOT NULL,
  message TEXT NOT NULL,
  product_info JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stakeholder_profiles_wallet ON stakeholder_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_participants ON chat_conversations(participant1, participant2);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);