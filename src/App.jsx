import React, { useEffect, useMemo, useRef, useState } from 'react'
import ChatList from './components/ChatList'
import ChatWindow from './components/ChatWindow'
import { io } from 'socket.io-client'
import { User } from './models/User'
import { Chat } from './models/Chat'

export default function App() {
  // Create initial models deterministically so hooks don't depend on each other
  const initialUsers = [new User('User 1', 'u1'), new User('User 2', 'u2'), new User('User 3', 'u3')]
  const initialChats = [new Chat([initialUsers[0].id, initialUsers[1].id])]

  const [users, setUsers] = useState(initialUsers)
  const [chats, setChats] = useState(initialChats)
  const [selectedChatId, setSelectedChatId] = useState(initialChats[0]?.id)
  const [currentUserId, setCurrentUserId] = useState(initialUsers[0].id)
  const [socketReady, setSocketReady] = useState(false)

  const usersById = useMemo(() => Object.fromEntries(users.map(u => [u.id, u])), [users])

  // Fallback local handlers so UI works even before socket connects
  const sendMessageToChat = useRef((chatId, fromId, text) => {
    const trimmed = (text || '').trim()
    if (!trimmed) return
    setChats(prev =>
      prev.map(c =>
        c.id === chatId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: Math.random().toString(36).slice(2, 10), senderId: fromId, content: trimmed, timestamp: Date.now() }
              ]
            }
          : c
      )
    )
  })
  const ensureChat = useRef((participantIds, cb) => {
    const id = participantIds.slice().sort().join('-')
    const existing = chats.find(c => c.id === id)
    if (existing) return cb?.(existing)
    const chat = new Chat(participantIds)
    setChats(prev => [...prev, chat])
    cb?.(chat)
  })
  const autoChatInit = useRef(false)

  useEffect(() => {
    const socket = io('http://localhost:4000')

    socket.on('connect', () => {
      setSocketReady(true)
      socket.emit('bootstrap')
    })

    socket.on('state', payload => {
      if (payload.users) setUsers(payload.users.map(u => new User(u.name, u.id)))
      if (payload.chats) setChats(payload.chats.map(c => ({ ...c })))
      if (payload.chats?.[0]) {
        setSelectedChatId(prev => prev ?? payload.chats[0].id)
      }
    })

    socket.on('chatUpdated', chat => {
      setChats(prev => {
        const existing = prev.find(c => c.id === chat.id)
        if (existing) {
          return prev.map(c => c.id === chat.id ? chat : c)
        }
        return [...prev, chat]
      })
    })

    // Expose methods for sends
    sendMessageToChat.current = (chatId, fromId, text) => {
      const trimmed = (text || '').trim()
      if (!trimmed) return

      // Optimistically add to local state so it shows immediately
      setChats(prev =>
        prev.map(c =>
          c.id === chatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: Math.random().toString(36).slice(2, 10),
                    senderId: fromId,
                    content: trimmed,
                    timestamp: Date.now()
                  }
                ]
              }
            : c
        )
      )

      // Send to backend for broadcast/persistence
      socket.emit('sendMessage', { chatId, fromId, text: trimmed })
    }
    ensureChat.current = (participantIds, cb) => {
      socket.emit('ensureChat', { participantIds }, cb)
    }

    return () => {
      socket.disconnect()
    }
  }, [])

  // Auto-open a chat with the first available other user so the composer is visible
  useEffect(() => {
    if (autoChatInit.current) return
    if (selectedChatId) return
    const other = users.find(u => u.id !== currentUserId)
    if (!other) return
    autoChatInit.current = true
    ensureChat.current([currentUserId, other.id], chat => {
      if (chat) {
        setChats(prev => {
          const exists = prev.find(c => c.id === chat.id)
          return exists ? prev : [...prev, chat]
        })
        setSelectedChatId(chat.id)
      }
    })
  }, [users, currentUserId, selectedChatId, socketReady])

  function onSendInSelected(text) {
    const activeChat = chats.find(c => c.id === selectedChatId)
    if (!activeChat || !activeChat.participantIds.includes(currentUserId)) return
    sendMessageToChat.current(selectedChatId, currentUserId, text)
  }

  function selectOrCreateChatWith(otherUserId) {
    const me = currentUserId
    if (otherUserId === me) {
      // don't create chat with self
      return
    }
    const id = [me, otherUserId].slice().sort().join('-')
    const existing = chats.find(c => c.id === id)
    if (existing) return setSelectedChatId(id)

    // Ask backend to ensure chat exists, then select it
    ensureChat.current([me, otherUserId], chat => {
      if (chat) {
        setChats(prev => {
          const already = prev.find(c => c.id === chat.id)
          return already ? prev : [...prev, chat]
        })
        setSelectedChatId(chat.id)
      } else {
        const local = new Chat([me, otherUserId])
        setChats(prev => [...prev, local])
        setSelectedChatId(local.id)
      }
    })
  }

  return (
    <div className="app">
      <div className="current-user">
        <label htmlFor="currentUser">Send as:</label>
        <select id="currentUser" value={currentUserId} onChange={e => setCurrentUserId(e.target.value)}>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <ChatList
        usersById={usersById}
        users={users}
        chats={chats}
        selectedChatId={selectedChatId}
        onSelect={setSelectedChatId}
        onSelectUser={selectOrCreateChatWith}
      />
      <ChatWindow
        chat={chats.find(c => c.id === selectedChatId)}
        usersById={usersById}
        currentUserId={currentUserId}
        onSend={onSendInSelected}
      />
    </div>
  )
}
