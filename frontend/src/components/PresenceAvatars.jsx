import React from 'react';

const PresenceAvatars = ({ users = [] }) => {
  const maxVisible = 3;
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <div className="flex items-center -space-x-2 overflow-hidden px-2">
      {visibleUsers.map((user, idx) => (
        <div 
          key={user.id || idx}
          className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shadow-sm"
          title={user.name || user.email}
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span>{(user.name || 'U').charAt(0).toUpperCase()}</span>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 text-gray-600 text-[10px] font-bold shadow-sm">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default PresenceAvatars;
