import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { Send, Menu, Paperclip, Smile } from 'lucide-react';
import { supabase } from '../lib/supabase';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
}

interface Message {
  id: string;
  content: string;
  user_id: string;
  room_id: string;
  created_at: string;
  user_metadata: {
    username?: string;
    avatar_url?: string;
    email?: string;
  };
}

interface ChatWindowProps {
  user: User;
  room: ChatRoom | null;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  user,
  room,
  sidebarOpen,
  onToggleSidebar
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (room) {
      fetchMessages();
      subscribeToMessages();
      subscribeToTyping();
    }
  }, [room]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!room) return;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (
          username,
          avatar_url,
          email
        )
      `)
      .eq('room_id', room.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (!error && data) {
      const formattedMessages = data.map(msg => ({
        ...msg,
        user_metadata: {
          username: msg.profiles?.username,
          avatar_url: msg.profiles?.avatar_url,
          email: msg.profiles?.email || msg.profiles?.username || 'Unknown User'
        }
      }));
      setMessages(formattedMessages);
    }
  };

  const subscribeToMessages = () => {
    if (!room) return;

    const channel = supabase
      .channel(`messages:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          // Fetch user metadata for new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url, email')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage = {
            ...payload.new,
            user_metadata: {
              username: profile?.username,
              avatar_url: profile?.avatar_url,
              email: profile?.email || 'Unknown User'
            }
          } as Message;

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const subscribeToTyping = () => {
    if (!room) return;

    const channel = supabase
      .channel(`typing:${room.id}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { user_id, username, typing } = payload;
        
        if (user_id !== user.id) {
          setTypingUsers(prev => {
            if (typing) {
              return prev.includes(username) ? prev : [...prev, username];
            } else {
              return prev.filter(u => u !== username);
            }
          });
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !room || loading) return;

    setLoading(true);
    const { error } = await supabase
      .from('messages')
      .insert([
        {
          content: newMessage.trim(),
          user_id: user.id,
          room_id: room.id,
        },
      ]);

    if (!error) {
      setNewMessage('');
      // Stop typing indicator
      await supabase.channel(`typing:${room.id}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          username: user.user_metadata?.username || user.email,
          typing: false
        }
      });
    }
    setLoading(false);
  };

  const handleTyping = () => {
    if (!room) return;

    // Send typing indicator
    supabase.channel(`typing:${room.id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: user.id,
        username: user.user_metadata?.username || user.email,
        typing: true
      }
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`typing:${room.id}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          username: user.user_metadata?.username || user.email,
          typing: false
        }
      });
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Chat
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select a room to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 lg:hidden"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              # {room.name}
            </h2>
            {room.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {room.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageList messages={messages} currentUserId={user.id} />
        <TypingIndicator users={typingUsers} />
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <form onSubmit={sendMessage} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder={`Message #${room.name}`}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              rows={1}
              style={{ maxHeight: '120px' }}
            />
            <div className="absolute right-2 bottom-2 flex space-x-1">
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Add file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Add emoji"
              >
                <Smile className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;