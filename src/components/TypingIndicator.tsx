import React from 'react';

interface TypingIndicatorProps {
  users: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing...`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`;
    } else {
      return `${users.slice(0, -1).join(', ')}, and ${users[users.length - 1]} are typing...`;
    }
  };

  return (
    <div className="flex items-center space-x-3 px-2 py-1">
      <div className="flex-shrink-0 w-10 flex justify-center">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
      <div className="flex-1">
        <span className="text-sm italic text-gray-500 dark:text-gray-400">
          {getTypingText()}
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator;