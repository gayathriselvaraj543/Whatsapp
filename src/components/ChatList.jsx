import React from 'react'

export default function ChatList({ users, usersById, chats, selectedChatId, onSelect, onSelectUser }) {
  return (
    <div className="chat-list">
      <div className="section-header">Chats</div>
      <div className="list">
        {chats.length === 0 && <div className="empty">No chats yet</div>}
        {chats.map(c => {
          const label = c.participantIds.map(id => usersById?.[id]?.name || id).join(', ')
          const isActive = selectedChatId === c.id
          return (
            <div
              key={c.id}
              className={`list-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(c.id)}
            >
              <div className="title">{label}</div>
              <div className="preview">
                {c.messages?.[c.messages.length - 1]?.content || 'Start chatting'}
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-header">Users</div>
      <div className="list">
        {users.map(u => (
          <div
            key={u.id}
            className="list-item selectable"
            onClick={() => onSelectUser?.(u.id)}
          >
            <div className="title">{u.name}</div>
            <div className="preview">Click to chat</div>
          </div>
        ))}
      </div>
    </div>
  )
}
