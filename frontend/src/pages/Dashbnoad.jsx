import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Galaxy3D from '../components/Galaxy3D'
import RouteFinder from '../components/RouteFinder'
import MissionTracker from '../components/MissionTracker'

export default function Dashboard() {
  const { token, user, logout } = useAuth()
  const [planets, setPlanets] = useState([])
  const [routes, setRoutes] = useState([])
  const [ships, setShips] = useState([])
  const [activeTab, setActiveTab] = useState('map')

  const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: { Authorization: `Bearer ${token}` }
  })

  useEffect(() => {
    api.get('/planets').then(r => setPlanets(r.data))
    api.get('/routes').then(r => setRoutes(r.data))
    api.get('/ships').then(r => setShips(r.data))
  }, [])

  const tabStyle = (tab) => ({
    padding: '0.5rem 1.5rem',
    background: activeTab === tab ? '#00d4ff' : '#1a1a2e',
    color: activeTab === tab ? '#0a0a1a' : 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  })

  return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #222' }}>
        <h1 style={{ color: '#00d4ff', margin: 0 }}>Galaxy Navigation System</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#888' }}>User: {user?.username} ({user?.role})</span>
          <button onClick={logout} style={{ padding: '0.5rem 1rem', background: '#ff4444', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', borderBottom: '1px solid #222' }}>
        {[
          { label: 'Planets', value: planets.length },
          { label: 'Ships', value: ships.length },
          { label: 'Routes', value: routes.length },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#1a1a2e', padding: '1rem', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00d4ff' }}>{stat.value}</div>
            <div style={{ color: '#888' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 2rem' }}>
        <button style={tabStyle('map')} onClick={() => setActiveTab('map')}>Galaxy Map</button>
        <button style={tabStyle('routes')} onClick={() => setActiveTab('routes')}>Route Finder</button>
        <button style={tabStyle('missions')} onClick={() => setActiveTab('missions')}>Missions</button>
      </div>

      <div style={{ padding: '0 2rem 2rem' }}>
        {activeTab === 'map' && (
          <Galaxy3D
            planets={planets}
            routes={routes}
            routeResult={null}
            startId={null}
            endId={null}
            onPlanetClick={(p) => console.log('Clicked:', p.name)}
          />
        )}
        {activeTab === 'routes' && (
          <RouteFinder planets={planets} ships={ships} token={token} />
        )}
        {activeTab === 'missions' && (
          <MissionTracker token={token} user={user} ships={ships} planets={planets} />
        )}
      </div>

    </div>
  )
}