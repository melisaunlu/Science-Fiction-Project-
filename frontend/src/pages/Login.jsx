import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    try {
      const res = await axios.post('http://localhost:3000/auth/login', { username, password })
      login(res.data.token, res.data.user)
      navigate('/')
    } catch {
      setError('Invalid username or password')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a1a' }}>
      <div style={{ background: '#1a1a2e', padding: '2rem', borderRadius: '12px', width: '360px', color: 'white' }}>
        <h1 style={{ textAlign: 'center', color: '#00d4ff' }}>🚀 Galaxy Nav</h1>
        <p style={{ textAlign: 'center', color: '#888' }}>Intergalactic Travel System</p>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #333', background: '#0a0a1a', color: 'white', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #333', background: '#0a0a1a', color: 'white', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            style={{ width: '100%', padding: '0.75rem', background: '#00d4ff', color: '#0a0a1a', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}