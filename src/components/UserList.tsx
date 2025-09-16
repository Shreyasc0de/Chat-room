import React, { useState, useEffect } from 'react';
import { Users, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChatRoom {
  id: string;
  name: string;
}

interface OnlineUser {
  id: string;
  username?: string;
  avatar_url?: string;
  email?: string;
  last_seen?: string;
}

interface UserListProps {
  room: ChatRoom | null;
}

const UserList: React.FC<UserListProps> = ({ room }) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (room) {
      fetchOnlineUsers();
      subscribeToPresence();
    }
  }, [room]);

  const fetchOnlineUsers = async () => {
    if (!room) return;

    // Get users who have been active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .gte('last_seen', fiveMinutesAgo);

    if (!error && data) {
      setOnlineUsers(data);
    }
  };

  const subscribeToPresence = () => {
    if (!room) return;

    const channel = supabase
      .channel(`presence:${room.id}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = Object.values(newState).flat() as OnlineUser[];
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers(prev => [...prev, ...newPresences as OnlineUser[]]);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = (leftPresences as OnlineUser[]).map(p => p.id);
        setOnlineUsers(prev => prev.filter(user => !leftIds.includes(user.id)));
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  if (!room) return null;

  return (
    <div className="w-60 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hidden xl:block">
      <div className="p-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Online — {onlineUsers.length}
          </h3>
          <span className="text-gray-400 dark:text-gray-500">
            {isCollapsed ? '▶' : '▼'}
          </span>
        </button>

        {!isCollapsed && (
          <div className="mt-4 space-y-2">
            {onlineUsers.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={
                      user.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        user.username || user.email || 'User'
                      )}`
                    }
                    alt="Avatar"
                    className="h-8 w-8 rounded-full"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  {index === 0 && (
                    <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.username || user.email || 'Unknown User'}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {index === 0 ? 'Admin' : 'Online'}
                  </p>
                </div>
              </div>
            ))}

            {onlineUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No one else is online
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;