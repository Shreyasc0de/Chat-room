import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
 
export async function createChatRoom(roomName: string, desc?: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase.from('chat_rooms').insert({
    name: roomName,
    description: desc,
    // created_by is set automatically by the DB default
  });

  if (error) throw error;
  return data;
}