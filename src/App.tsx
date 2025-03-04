import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { Room, fibonacciPoints, tshirtSizes } from './types'
import { PieChart } from './components/PieChart'
import './App.css'
import ocucoLogo from '/ocuco.svg'

function App() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [name, setName] = useState(() => localStorage.getItem('pokerName') || '')
  const [roomId, setRoomId] = useState(() => localStorage.getItem('pokerRoomId') || '')
  const [room, setRoom] = useState<Room | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [requestAdmin, setRequestAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const newSocket = io('http://localhost:3001')
    setSocket(socket => {
      if (socket) socket.disconnect()
      return newSocket
    })

    // Auto-join if we have stored credentials
    if (localStorage.getItem('pokerName') && localStorage.getItem('pokerRoomId')) {
      handleJoin()
    }

    return () => {
      newSocket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('roomUpdate', (updatedRoom: Room) => {
      setRoom(updatedRoom)
      setError(null) // Clear any errors on successful room update
    })

    socket.on('kicked', () => {
      handleLeave()
    })

    socket.on('joinError', (message: string) => {
      setError(message)
      setIsJoined(false)
    })

    return () => {
      socket.off('roomUpdate')
      socket.off('kicked')
      socket.off('joinError')
    }
  }, [socket])

  const handleJoin = () => {
    if (socket && name && roomId) {
      socket.emit('joinRoom', { roomId, memberName: name, requestAdmin })
      localStorage.setItem('pokerName', name)
      localStorage.setItem('pokerRoomId', roomId)
      setIsJoined(true)
    }
  }

  // Add function to leave room
  const handleLeave = () => {
    localStorage.removeItem('pokerName')
    localStorage.removeItem('pokerRoomId')
    setIsJoined(false)
    if (socket) {
      socket.disconnect()
      const newSocket = io('http://localhost:3001')
      setSocket(newSocket)
    }
  }

  const handleVote = (vote: string) => {
    if (socket && roomId) {
      socket.emit('vote', { roomId, vote })
    }
  }

  const handleReveal = () => {
    if (socket && roomId) {
      socket.emit('reveal', roomId)
    }
  }

  const handleReset = () => {
    if (socket && roomId) {
      socket.emit('reset', roomId)
    }
  }

  const handleChangeVotingSystem = (system: 'fibonacci' | 'tshirt') => {
    if (socket && roomId) {
      socket.emit('changeVotingSystem', { roomId, system })
    }
  }

  const handleRemoveMember = (memberId: string) => {
    if (socket && roomId) {
      socket.emit('removeMember', { roomId, memberId })
    }
  }

  if (!isJoined) {
    return (
      <div className="join-form">
        <img src={ocucoLogo} alt="Ocuco" className="company-logo" />
        {error && <div className="error-message">{error}</div>}
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={requestAdmin}
            onChange={(e) => setRequestAdmin(e.target.checked)}
          />
          Join as Admin
        </label>
        <button onClick={handleJoin}>Join Room</button>
      </div>
    )
  }

  const isAdmin = Boolean(room?.adminId && socket?.id && room.adminId === socket.id);
  const points = room?.votingSystem === 'fibonacci' ? fibonacciPoints : tshirtSizes;
  

  return (
    <div className="poker-room">
      <div className="header">
        <img src={ocucoLogo} alt="Ocuco" className="company-logo" />
        <div className="room-id">
          {roomId}
          {isAdmin && ' (Admin)'}
        </div>
        <button className="leave-button" onClick={handleLeave}>Leave Room</button>
      </div>
      <div className="controls">
        {isAdmin && (
          <>
            <select 
              value={room?.votingSystem} 
              onChange={(e) => handleChangeVotingSystem(e.target.value as 'fibonacci' | 'tshirt')}
            >
              <option value="fibonacci">Fibonacci</option>
              <option value="tshirt">T-Shirt Sizes</option>
            </select>
            <button 
              onClick={handleReveal} 
              disabled={!room?.members.some(member => member.vote)}
            >
              Reveal Cards
            </button>
            <button onClick={handleReset}>
              Reset Votes
            </button>
          </>
        )}
      </div>

      <div className="voting-area">
        {points.map((point) => (
          <button
            key={point}
            onClick={() => handleVote(point)}
            className={room?.members.find(m => m.id === socket?.id)?.vote === point ? 'selected' : ''}
          >
            {point}
          </button>
        ))}
      </div>

      <div className="members-and-results">
        <div className="members-list">
          <h3>Team Members</h3>
          {room?.members.map((member) => (
            <div key={member.id} className="member">
              {member.name}
              {member.isAdmin && ' (Admin)'}: {room.revealed ? member.vote || 'No vote' : member.vote ? '✓' : '...'}
              {isAdmin && member.id !== socket?.id && (
                <button 
                  onClick={() => handleRemoveMember(member.id)}
                  className="remove-member"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="results">
          {room && <PieChart members={room.members} revealed={room.revealed} />}
        </div>
      </div>
    </div>
  )
}

export default App
