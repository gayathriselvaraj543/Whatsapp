import React, { useEffect, useRef, useState } from 'react'

export default function ChatWindow({ chat, usersById, currentUserId, onSend }) {
  const [text, setText] = useState('')
  const messagesRef = useRef(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [chat?.messages])

  if (!chat) return <div className="chat-window empty-state">Select a chat to start messaging</div>

  const title = chat.participantIds
    .map(id => usersById[id]?.name || id)
    .join(', ')

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-title">{title}</div>
        <div className="chat-participants">{chat.participantIds.length} participants</div>
      </div>

      <div className="messages" ref={messagesRef}>
        {chat.messages.map(m => {
          const isMe = m.senderId === currentUserId
          return (
            <div key={m.id} className={`message ${isMe ? 'me' : 'other'}`}>
              <div className="meta">
                <span className="sender">{usersById[m.senderId]?.name || m.senderId}</span>
                <span className="time">{new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="content">{m.content}</div>
            </div>
          )
        })}
      </div>

      <div className="composer">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (text.trim()) {
                onSend(text)
                setText('')
              }
            }
          }}
        />
        <button
          onClick={() => {
            if (text.trim()) {
              onSend(text)
              setText('')
            }
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
