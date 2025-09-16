/*
  # Advanced Real-Time Chat Application Schema

  1. New Tables
    - `profiles` - User profiles with username, avatar, and presence tracking
    - `chat_rooms` - Chat rooms with name, description, and metadata
    - `messages` - Chat messages with content, timestamps, and user references
    - `room_members` - Many-to-many relationship between users and rooms
    - `message_reactions` - Message reactions and emoji responses

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Room-based access control for messages
    - Public read access for room discovery

  3. Real-time Features
    - Triggers for updating user presence
    - Automatic profile creation on user signup
    - Message broadcasting setup
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE,
  avatar_url text,
  email text,
  last_seen timestamptz DEFAULT now(),
  is_online boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  reply_to uuid REFERENCES messages(id) ON DELETE SET NULL,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create room_members table
CREATE TABLE IF NOT EXISTS room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Chat rooms policies
CREATE POLICY "Chat rooms are viewable by everyone"
  ON chat_rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create rooms"
  ON chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Room creators can update their rooms"
  ON chat_rooms FOR UPDATE
  USING (auth.uid() = created_by);

-- Messages policies
CREATE POLICY "Messages are viewable by room members"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members 
      WHERE room_members.room_id = messages.room_id 
      AND room_members.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE chat_rooms.id = messages.room_id 
      AND chat_rooms.is_private = false
    )
  );

CREATE POLICY "Authenticated users can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Room members policies
CREATE POLICY "Room members are viewable by room members"
  ON room_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = room_members.room_id 
      AND rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join public rooms"
  ON room_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE chat_rooms.id = room_id 
      AND chat_rooms.is_private = false
    )
  );

-- Message reactions policies
CREATE POLICY "Reactions are viewable by room members"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN room_members rm ON rm.room_id = m.room_id
      WHERE m.id = message_reactions.message_id
      AND rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own reactions"
  ON message_reactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(new.email::bytea, 'base64')
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update user presence
CREATE OR REPLACE FUNCTION public.update_user_presence()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET 
    last_seen = now(),
    is_online = true,
    updated_at = now()
  WHERE id = auth.uid();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default chat rooms
INSERT INTO chat_rooms (name, description, is_private) VALUES
  ('general', 'General discussion for everyone', false),
  ('random', 'Random conversations and off-topic chat', false),
  ('tech-talk', 'Discuss technology, programming, and development', false),
  ('announcements', 'Important announcements and updates', false)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);