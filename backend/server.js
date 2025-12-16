const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')

const app = express()
app.use(cors({ origin: '*' }))

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const users = [
  { id: 'u1', name: 'User 1' },
  { id: 'u2', name: 'User 2' },
  { id: 'u3', name: 'User 3' }
]

const chats = new Map()

function chatId(participantIds) {
  return participantIds.slice().sort().join('-')
}

function ensureChat(participantIds) {
  const id = chatId(participantIds)
  if (!chats.has(id)) {
    const uniqueParticipants = Array.from(new Set(participantIds))
    chats.set(id, { id, participantIds: uniqueParticipants, messages: [] })
  }
  return chats.get(id)
}

function makeMessage({ senderId, content }) {
  return {
    id: Math.random().toString(36).slice(2, 10),
    senderId,
    content,
    type: 'text',
    timestamp: Date.now()
  }
}

io.on('connection', socket => {
  socket.on('bootstrap', () => {
    socket.emit('state', {
      users,
      chats: Array.from(chats.values())
    })
  })

  socket.on('ensureChat', ({ participantIds } = {}, cb) => {
    if (!Array.isArray(participantIds) || participantIds.length < 2) return
    const chat = ensureChat(participantIds)
    io.emit('chatUpdated', chat)
    if (cb) cb(chat)
  })

  socket.on('sendMessage', ({ chatId: incomingChatId, fromId, text } = {}) => {
    if (!fromId || !text || !text.trim()) return

    let chat = incomingChatId ? chats.get(incomingChatId) : null
    if (!chat && incomingChatId) {
      chat = ensureChat(incomingChatId.split('-'))
    }
    if (!chat) return

    const msg = makeMessage({ senderId: fromId, content: text.trim() })
    chat.messages.push(msg)
    io.emit('chatUpdated', chat)
  })
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`Realtime chat backend listening on :${PORT}`)
})

