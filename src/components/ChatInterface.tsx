import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import UserList from './UserList';
import { supabase } from '../lib/supabase';

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface ChatInterfaceProps {
  user: User;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchRooms();
    updateUserPresence();
    joinDefaultRooms();
  }, []);

  // Add mock rooms if no rooms are fetched after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (rooms.length === 0) {
        const mockRooms: ChatRoom[] = [
          { id: '1', name: 'general', description: 'General discussion for everyone', created_at: new Date().toISOString() },
          { id: '2', name: 'random', description: 'Random conversations and off-topic chat', created_at: new Date().toISOString() },
          { id: '3', name: 'tech-talk', description: 'Discuss technology, programming, and development', created_at: new Date().toISOString() },
          { id: '4', name: 'announcements', description: 'Important announcements and updates', created_at: new Date().toISOString() }
        ];
        setRooms(mockRooms);
        setActiveRoom(mockRooms[0]);
        console.log('Using mock rooms:', mockRooms);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [rooms.length]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching rooms:', error);
        return;
      }

      if (data) {
        setRooms(data);
        if (data.length > 0 && !activeRoom) {
          setActiveRoom(data[0]);
        }
        console.log('Rooms fetched:', data);
      }
    } catch (err) {
      console.error('Unexpected error fetching rooms:', err);
    }
  };

  const updateUserPresence = async () => {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0],
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email || 'User')}`,
        is_online: true,
        last_seen: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating user presence:', error);
    }
  };

  const joinDefaultRooms = async () => {
    // Auto-join user to all public rooms
    const { data: rooms } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('is_private', false);

    if (rooms) {
      for (const room of rooms) {
        await supabase
          .from('room_members')
          .upsert({
            room_id: room.id,
            user_id: user.id,
            role: 'member'
          }, {
            onConflict: 'room_id,user_id'
          });
      }
    }
  };

  const createRoom = async (name: string, description?: string) => {
    try {
      // Check if user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current user:', currentUser);
      
      if (!currentUser) {
        alert('You must be signed in to create rooms');
        return;
      }

      const { data, error } = await supabase
        .from('chat_rooms')
        .insert([{ name, description, created_by: currentUser.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating room:', error);
        alert(`Failed to create room: ${error.message}`);
        return;
      }

      if (data) {
        setRooms(prev => [...prev, data]);
        setActiveRoom(data);
        console.log('Room created successfully:', data);
      }
    } catch (err) {
      console.error('Unexpected error creating room:', err);
      alert('An unexpected error occurred while creating the room');
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar
        user={user}
        rooms={rooms}
        activeRoom={activeRoom}
        onRoomSelect={setActiveRoom}
        onCreateRoom={createRoom}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 flex">
        <ChatWindow
          user={user}
          room={activeRoom}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <UserList room={activeRoom} />
      </div>
    </div>
  );
};

export default ChatInterface;