import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { tex } from '../lib/textures'
import { paintMaterial } from './PaintMaterial'
import { projects } from '../data/content'
import { useStore, nav } from '../store'
import { sound } from '../lib/audio'

const RADIUS = 4.4
const ROOM_R = 7.5
const EYE = 1.65
const N = projects.length
const STEP = (Math.PI * 2) / N
const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt))
const wrapIndex = (i) => ((i % N) + N) % N

// Shared, mutable carousel state so the HTML UI can drive it too.
export const carousel = {
  angle: 0,
  target: 0,
  velocity: 0,
  dragging: false,
  moved: 0,
  frontIndex: () => wrapIndex(Math.round(carousel.target / STEP)),
  goTo(i) {
    // shortest rotation to bring project i to the front
    const current = carousel.target
    const base = Math.round(current / (Math.PI * 2)) * Math.PI * 2
    let t = base + i * STEP
    while (t - current > Math.PI) t -= Math.PI * 2
    while (current - t > Math.PI) t += Math.PI * 2
    carousel.target = t
  },
  next() {
    carousel.target = Math.round(carousel.target / STEP) * STEP + STEP
    sound.paper()
    syncSelection()
  },
  prev() {
    carousel.target = Math.round(carousel.target / STEP) * STEP - STEP
    sound.paper()
    syncSelection()
  },
}

function syncSelection() {
  const s = useStore.getState()
  if (s.selectedProject !== null) s.set({ selectedProject: carousel.frontIndex() })
}

export function selectProject(i) {
  carousel.goTo(i)
  useStore.getState().set({ selectedProject: i })
  useStore.getState().unlock('curator')
  sound.click()
}

function ProjectFrame({ index }) {
  const art = useMemo(
    () => paintMaterial({ sketch: tex(`art:p${index}:sketch`), color: tex(`art:p${index}:color`), seed: 3 + index * 2.3 }),
    [index],
  )
  const border = useMemo(() => new THREE.MeshBasicMaterial({ map: tex(`frame:${index % 3}`), transparent: true, alphaTest: 0.05 }), [index])
  const caption = useMemo(() => new THREE.MeshBasicMaterial({ map: tex(`caption:p${index}`), transparent: true }), [index])
  const group = useRef()
  const hovered = useRef(false)

  useFrame((_, dt) => {
    // angular distance of this frame from the front
    let diff = (carousel.angle - index * STEP) % (Math.PI * 2)
    if (diff > Math.PI) diff -= Math.PI * 2
    if (diff < -Math.PI) diff += Math.PI * 2
    const facing = Math.abs(diff) < STEP * 0.55
    const u = art.uniforms
    u.uReveal.value = THREE.MathUtils.clamp(u.uReveal.value + (facing ? dt * 0.8 : -dt * 0.9), 0, 1)
    u.uHover.value = damp(u.uHover.value, hovered.current ? 1 : 0, 8, dt)
    const sc = damp(group.current.scale.x, hovered.current ? 1.04 : 1, 8, dt)
    group.current.scale.setScalar(sc)
  })

  const onClick = (e) => {
    e.stopPropagation()
    if (carousel.moved > 6) return
    selectProject(index)
  }

  return (
    <group rotation={[0, -index * STEP, 0]}>
      <group ref={group} position={[0, EYE, -RADIUS]}>
        <mesh position={[0, 0.18, -0.01]} material={border}>
          <planeGeometry args={[1.34, 1.95]} />
        </mesh>
        <mesh
          material={art}
          onClick={onClick}
          onPointerOver={(e) => {
            e.stopPropagation()
            hovered.current = true
            document.body.classList.add('is-pointer')
            sound.pencil()
          }}
          onPointerOut={() => {
            hovered.current = false
            document.body.classList.remove('is-pointer')
          }}
        >
          <planeGeometry args={[1.1, 1.37]} />
        </mesh>
        <mesh position={[0, -0.9, 0]} material={caption}>
          <planeGeometry args={[1.2, 0.225]} />
        </mesh>
      </group>
    </group>
  )
}

function Shell() {
  const wall = useMemo(() => new THREE.MeshBasicMaterial({ map: tex('roundwall'), side: THREE.BackSide }), [])
  const floor = useMemo(() => new THREE.MeshBasicMaterial({ map: tex('roundfloor') }), [])
  const ceiling = useMemo(() => {
    const t = tex('ceiling').clone()
    t.repeat.set(3, 3)
    t.needsUpdate = true
    return new THREE.MeshBasicMaterial({ map: t })
  }, [])
  return (
    <group>
      <mesh position={[0, 2.1, 0]} material={wall}>
        <cylinderGeometry args={[ROOM_R, ROOM_R, 4.2, 64, 1, true]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor}>
        <circleGeometry args={[ROOM_R, 64]} />
      </mesh>
      <mesh position={[0, 4.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={ceiling}>
        <circleGeometry args={[ROOM_R, 64]} />
      </mesh>
    </group>
  )
}

export default function GalleryRoom() {
  const ring = useRef()
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const cam = useRef({ z: 0.6, x: 0 })

  // drag to rotate
  useEffect(() => {
    const el = gl.domElement
    let lastX = 0
    const down = (e) => {
      carousel.dragging = true
      carousel.moved = 0
      lastX = e.clientX
      carousel.velocity = 0
    }
    const move = (e) => {
      if (!carousel.dragging) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      carousel.moved += Math.abs(dx)
      const d = dx * 0.0045
      carousel.target += d
      carousel.velocity = d
    }
    const up = () => {
      if (!carousel.dragging) return
      carousel.dragging = false
      if (carousel.moved > 6) {
        carousel.target = Math.round((carousel.target + carousel.velocity * 12) / STEP) * STEP
        syncSelection()
      }
    }
    let wheelLock = 0
    const wheel = (e) => {
      if (useStore.getState().panel || useStore.getState().menuOpen) return
      const now = performance.now()
      if (now - wheelLock < 450 || Math.abs(e.deltaY) < 8) return
      wheelLock = now
      e.deltaY > 0 ? carousel.next() : carousel.prev()
    }
    const key = (e) => {
      if (e.code === 'ArrowRight') carousel.next()
      if (e.code === 'ArrowLeft') carousel.prev()
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('wheel', wheel, { passive: true })
    window.addEventListener('keydown', key)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('keydown', key)
      carousel.dragging = false
    }
  }, [gl])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    carousel.angle = damp(carousel.angle, carousel.target, carousel.dragging ? 14 : 5, dt)
    ring.current.rotation.y = carousel.angle

    const selected = useStore.getState().selectedProject !== null
    const wide = window.innerWidth > 820
    cam.current.z = damp(cam.current.z, selected ? -RADIUS + 2.3 : 0.6, 3.5, dt)
    cam.current.x = damp(cam.current.x, selected && wide ? 0.55 : 0, 3.5, dt)
    camera.position.set(cam.current.x, EYE + (selected && !wide ? -0.35 : 0), cam.current.z)
    camera.rotation.set(-nav.mouseY * 0.05, -nav.mouseX * 0.08, 0)
  })

  return (
    <group>
      <Shell />
      <group ref={ring}>
        {projects.map((p, i) => (
          <ProjectFrame key={p.id} index={i} />
        ))}
      </group>
    </group>
  )
}
