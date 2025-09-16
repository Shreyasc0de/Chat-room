import React from 'react';
import { formatDistanceToNow } from '../utils/dateUtils';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user_metadata: {
    username?: string;
    avatar_url?: string;
    email?: string;
  };
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const shouldShowAvatar = (message: Message, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    return prevMessage.user_id !== message.user_id ||
           new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000; // 5 minutes
  };

  const shouldShowTimestamp = (message: Message, index: number) => {
    return shouldShowAvatar(message, index);
  };

  return (
    <>
      {messages.map((message, index) => {
        const showAvatar = shouldShowAvatar(message, index);
        const showTimestamp = shouldShowTimestamp(message, index);
        const isOwnMessage = message.user_id === currentUserId;

        return (
          <div
            key={message.id}
            className={`flex items-start space-x-3 group hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 py-1 -mx-2 rounded ${
              showAvatar ? 'mt-4' : 'mt-0.5'
            }`}
          >
            <div className="flex-shrink-0 w-10">
              {showAvatar ? (
                <img
                  src={
                    message.user_metadata?.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      message.user_metadata?.username || message.user_metadata?.email || 'User'
                    )}`
                  }
                  alt="Avatar"
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {showAvatar && (
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`font-semibold text-sm ${
                    isOwnMessage 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {message.user_metadata?.username || message.user_metadata?.email || 'Unknown User'}
                  </span>
                  {isOwnMessage && (
                    <span className="text-xs text-blue-500 dark:text-blue-400">(You)</span>
                  )}
                  {showTimestamp && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(message.created_at))}
                    </span>
                  )}
                </div>
              )}

              <div className={`text-gray-900 dark:text-gray-100 text-sm leading-relaxed ${
                showAvatar ? '' : 'pl-0'
              }`}>
                {message.content.split('\n').map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    {line}
                    {lineIndex < message.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default MessageList;