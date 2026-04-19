import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function getPlanetColors(planet) {
  const hash = planet.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const types = [
    { color: 0x4488ff, emissive: 0x112244, name: 'ice' },
    { color: 0xff6622, emissive: 0x441100, name: 'lava' },
    { color: 0x44ff88, emissive: 0x114422, name: 'jungle' },
    { color: 0xffaa33, emissive: 0x442200, name: 'desert' },
    { color: 0xaaaaff, emissive: 0x222244, name: 'gas' },
    { color: 0xff4444, emissive: 0x440000, name: 'red dwarf' },
  ]
  return types[hash % types.length]
}

function createAtmosphere(radius, color) {
  const geo = new THREE.SphereGeometry(radius * 1.15, 32, 32)
  const mat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.12, side: THREE.FrontSide })
  return new THREE.Mesh(geo, mat)
}

function createRings(radius, color) {
  const geo = new THREE.RingGeometry(radius * 1.4, radius * 2.2, 64)
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
  const ring = new THREE.Mesh(geo, mat)
  ring.rotation.x = Math.PI / 3
  return ring
}

function createNebulaCloud(position) {
  const geo = new THREE.BufferGeometry()
  const verts = [], colors = []
  for (let i = 0; i < 300; i++) {
    verts.push(
      position.x + (Math.random() - 0.5) * 8,
      position.y + (Math.random() - 0.5) * 8,
      position.z + (Math.random() - 0.5) * 8
    )
    colors.push(Math.random() * 0.3 + 0.1, Math.random() * 0.1, Math.random() * 0.5 + 0.3)
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.3, vertexColors: true, transparent: true, opacity: 0.6 }))
}

function createAsteroidBelt(center, radius) {
  const geo = new THREE.BufferGeometry()
  const verts = []
  for (let i = 0; i < 500; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = radius + (Math.random() - 0.5) * 3
    verts.push(
      center.x + Math.cos(angle) * r,
      center.y + (Math.random() - 0.5) * 0.5,
      center.z + Math.sin(angle) * r
    )
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x888866, size: 0.08, transparent: true, opacity: 0.7 }))
}

function createStarfield() {
  const geo = new THREE.BufferGeometry()
  const verts = [], colors = []
  for (let i = 0; i < 5000; i++) {
    verts.push((Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300)
    const warm = Math.random() > 0.7
    colors.push(warm ? 1 : 0.7, warm ? 0.9 : 0.8, warm ? 0.7 : 1)
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.15, vertexColors: true }))
}

function createWormhole(position) {
  const group = new THREE.Group()
  group.position.copy(position)
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.RingGeometry(1.2 + i * 0.4, 1.5 + i * 0.4, 64)
    const mat = new THREE.MeshBasicMaterial({
      color: [0x9900ff, 0x4400ff, 0x0044ff][i],
      transparent: true, opacity: 0.3 - i * 0.08, side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(geo, mat)
    ring.userData.rotSpeed = 0.02 + i * 0.01
    group.add(ring)
  }
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x220044, transparent: true, opacity: 0.9 })
  ))
  return group
}

function createExhaustTrail() {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(60 * 3)
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xff6600, size: 0.15, transparent: true, opacity: 0.8 }))
}

export default function Galaxy3D({ planets, routes, onPlanetClick, startId, endId, routeResult }) {
  const mountRef = useRef()
  const followShipRef = useRef(false)
  const cameraRef = useRef(null)
  const shipMeshRef = useRef(null)

  useEffect(() => {
    if (!planets.length) return

    const width = mountRef.current.clientWidth
    const height = 600
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x050510, 0.008)

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(0, 10, 28)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setClearColor(0x050510)
    mountRef.current.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x334466, 0.6))
    const sun = new THREE.PointLight(0xffffff, 2, 100)
    sun.position.set(0, 20, 0)
    scene.add(sun)
    scene.add(createStarfield())

    const xs = planets.map(p => p.x)
    const ys = planets.map(p => p.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1
    const scaleV = (val, min, range) => ((val - min) / range) * 20 - 10

    const planetMeshes = {}
    const planetPositions = {}
    const planetGroups = {}

    planets.forEach((p, i) => {
      const x = scaleV(p.x, minX, rangeX)
      const y = scaleV(p.y, minY, rangeY)
      const z = (i % 4) * 4 - 6
      const pos = new THREE.Vector3(x, y, z)
      planetPositions[p.id] = pos

      const type = getPlanetColors(p)
      const hash = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const radius = 0.5 + (hash % 4) * 0.15

      const group = new THREE.Group()
      group.position.copy(pos)

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 64, 64),
        new THREE.MeshStandardMaterial({
          color: type.color, emissive: type.emissive,
          emissiveIntensity: 0.4, roughness: 0.8, metalness: 0.1,
        })
      )
      mesh.userData = { planet: p }
      group.add(mesh)
      planetMeshes[p.id] = mesh

      group.add(createAtmosphere(radius, type.color))
      if (type.name === 'gas') group.add(createRings(radius, type.color))
      if (hash % 3 === 0) scene.add(createAsteroidBelt(pos, radius + 3))
      if (hash % 4 === 0) scene.add(createNebulaCloud(pos))

      scene.add(group)
      planetGroups[p.id] = group
    })

    if (planets.length >= 2) {
      const midX = (planetPositions[planets[0].id].x + planetPositions[planets[1].id].x) / 2
      const midY = (planetPositions[planets[0].id].y + planetPositions[planets[1].id].y) / 2
      scene.add(createWormhole(new THREE.Vector3(midX, midY, 0)))
    }

    routes.forEach(r => {
      const from = planetPositions[r.origin_planet_id]
      const to = planetPositions[r.destination_planet_id]
      if (!from || !to) return
      const highlightPath = routeResult?.path || []
      const isHighlighted = highlightPath.some(
        s => s.planet?.id === r.origin_planet_id || s.planet?.id === r.destination_planet_id
      )
      const geo = new THREE.BufferGeometry().setFromPoints([from, to])
      const mat = new THREE.LineBasicMaterial({
        color: isHighlighted ? 0x00d4ff : 0x223344,
        transparent: true, opacity: isHighlighted ? 1 : 0.35,
      })
      scene.add(new THREE.Line(geo, mat))
    })

    let shipMesh = null
    let exhaustTrail = null
    let shipProgress = 0
    let shipSegment = 0
    const trailHistory = []

    const pathPositions = (routeResult?.path || [])
      .map(s => planetPositions[s.planet?.id])
      .filter(Boolean)

    if (pathPositions.length > 1) {
      const shipGroup = new THREE.Group()
      shipGroup.add(new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.7, 8),
        new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff6600, emissiveIntensity: 1 })
      ))
      exhaustTrail = createExhaustTrail()
      scene.add(exhaustTrail)
      scene.add(shipGroup)
      shipMesh = shipGroup
      shipMeshRef.current = shipGroup
    }

    // Orbit state
    const orbitState = {
      spherical: new THREE.Spherical(28, Math.PI / 3, 0),
      target: new THREE.Vector3(0, 0, 0),
      isDragging: false,
      prevMouse: { x: 0, y: 0 },
    }

    // Apply spherical to camera
    function applyOrbit() {
      const offset = new THREE.Vector3().setFromSpherical(orbitState.spherical)
      camera.position.copy(orbitState.target).add(offset)
      camera.lookAt(orbitState.target)
    }
    applyOrbit()

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const meshList = Object.values(planetMeshes)

    function onClick(e) {
      if (followShipRef.current) return
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(meshList)
      if (hits.length > 0 && onPlanetClick) onPlanetClick(hits[0].object.userData.planet)
    }

    function onMouseDown(e) {
      orbitState.isDragging = true
      orbitState.prevMouse = { x: e.clientX, y: e.clientY }
    }
    function onMouseUp() { orbitState.isDragging = false }
    function onMouseMove(e) {
      if (!orbitState.isDragging || followShipRef.current) return
      const dx = e.clientX - orbitState.prevMouse.x
      const dy = e.clientY - orbitState.prevMouse.y
      orbitState.spherical.theta -= dx * 0.01
      orbitState.spherical.phi -= dy * 0.01
      orbitState.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbitState.spherical.phi))
      orbitState.prevMouse = { x: e.clientX, y: e.clientY }
      applyOrbit()
    }
    function onWheel(e) {
      if (followShipRef.current) return
      orbitState.spherical.radius += e.deltaY * 0.05
      orbitState.spherical.radius = Math.max(5, Math.min(100, orbitState.spherical.radius))
      applyOrbit()
    }

    renderer.domElement.addEventListener('click', onClick)
    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('wheel', onWheel)

    let animId
    let elapsed = 0
    let lastTime = performance.now()

    function animate() {
      animId = requestAnimationFrame(animate)
      const now = performance.now()
      elapsed += (now - lastTime) / 1000
      lastTime = now
      const t = elapsed

      Object.values(planetGroups).forEach(group => {
        if (group.children[0]) group.children[0].rotation.y += 0.004
      })

      scene.children.forEach(obj => {
        if (obj.isGroup) {
          obj.children.forEach(child => {
            if (child.userData.rotSpeed) child.rotation.z += child.userData.rotSpeed
          })
        }
      })

      if (shipMesh && pathPositions.length > 1) {
        shipProgress += 0.004
        if (shipProgress >= 1) {
          shipProgress = 0
          shipSegment = (shipSegment + 1) % (pathPositions.length - 1)
          trailHistory.length = 0
        }
        const from = pathPositions[shipSegment]
        const to = pathPositions[shipSegment + 1]
        const pos = new THREE.Vector3().lerpVectors(from, to, shipProgress)
        pos.y += Math.sin(shipProgress * Math.PI) * 2
        shipMesh.position.copy(pos)
        shipMesh.rotation.y += 0.05

        trailHistory.unshift(pos.clone())
        if (trailHistory.length > 60) trailHistory.pop()

        if (exhaustTrail) {
          const positions = exhaustTrail.geometry.attributes.position.array
          trailHistory.forEach((p, i) => {
            positions[i * 3] = p.x + (Math.random() - 0.5) * 0.1
            positions[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.1
            positions[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.1
          })
          exhaustTrail.geometry.attributes.position.needsUpdate = true
          exhaustTrail.material.opacity = 0.6 + Math.sin(t * 10) * 0.2
        }

        // Ship camera follows ship
        if (followShipRef.current) {
          const shipPos = shipMesh.position
          const behind = new THREE.Vector3(
            shipPos.x - Math.sin(shipMesh.rotation.y) * 6,
            shipPos.y + 3,
            shipPos.z + 6
          )
          camera.position.lerp(behind, 0.06)
          camera.lookAt(shipPos)
        }
      }

      sun.intensity = 1.8 + Math.sin(t * 2) * 0.3
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('wheel', onWheel)
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [planets, routes, startId, endId, routeResult])

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={mountRef}
        style={{ width: '100%', height: '600px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', cursor: 'grab' }}
      />
      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button
          onClick={() => { followShipRef.current = true }}
          style={{ padding: '0.5rem 1rem', background: '#ffaa00', color: '#0a0a1a', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🚀 Ship Camera
        </button>
        <button
          onClick={() => {
            followShipRef.current = false
            if (cameraRef.current) {
              cameraRef.current.position.set(0, 10, 28)
              cameraRef.current.lookAt(0, 0, 0)
            }
          }}
          style={{ padding: '0.5rem 1rem', background: '#1a1a2e', color: 'white', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer' }}
        >
          🌌 Galaxy View
        </button>
      </div>
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', color: '#888', fontSize: '0.75rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '6px' }}>
        Drag to rotate | Scroll to zoom | Click planet to select
      </div>
    </div>
  )
}