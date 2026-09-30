import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { tex, DOOR } from '../lib/textures'
import { paintMaterial } from './PaintMaterial'
import { CORRIDOR, rooms, corridorArt } from '../data/content'
import { useStore, view, doors } from '../store'
import { enterRoom } from '../director'
import { sound } from '../lib/audio'

const HALF = CORRIDOR.width / 2
const LEN = CORRIDOR.backZ - CORRIDOR.endWallZ
const MID = (CORRIDOR.backZ + CORRIDOR.endWallZ) / 2
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt))

// Where the corridor pictures hang (avoiding the doors)
export const FRAME_SLOTS = [
  { z: -5, side: 1 },
  { z: -11, side: 1 },
  { z: -17, side: -1 },
  { z: -23, side: -1 },
  { z: -29, side: 1 },
  { z: -35, side: 1 },
  { z: -41, side: -1 },
  { z: -47, side: -1 },
]

const wallRotation = (side) => (side === -1 ? Math.PI / 2 : -Math.PI / 2)

function setCursor(on) {
  document.body.classList.toggle('is-pointer', on)
}

function Surfaces() {
  const basic = (key) => new THREE.MeshBasicMaterial({ map: tex(key) })
  const mats = useMemo(
    () => ({
      wall: basic('wall'),
      floor: basic('floor'),
      ceiling: basic('ceiling'),
      back: basic('backwall'),
    }),
    [],
  )
  return (
    <group>
      <mesh position={[-HALF, CORRIDOR.height / 2, MID]} rotation={[0, Math.PI / 2, 0]} material={mats.wall}>
        <planeGeometry args={[LEN, CORRIDOR.height]} />
      </mesh>
      <mesh position={[HALF, CORRIDOR.height / 2, MID]} rotation={[0, -Math.PI / 2, 0]} material={mats.wall}>
        <planeGeometry args={[LEN, CORRIDOR.height]} />
      </mesh>
      <mesh position={[0, 0, MID]} rotation={[-Math.PI / 2, 0, 0]} material={mats.floor}>
        <planeGeometry args={[CORRIDOR.width, LEN]} />
      </mesh>
      <mesh position={[0, CORRIDOR.height, MID]} rotation={[Math.PI / 2, 0, 0]} material={mats.ceiling}>
        <planeGeometry args={[CORRIDOR.width, LEN]} />
      </mesh>
      <mesh position={[0, CORRIDOR.height / 2, CORRIDOR.backZ]} rotation={[0, Math.PI, 0]} material={mats.back}>
        <planeGeometry args={[CORRIDOR.width, CORRIDOR.height]} />
      </mesh>
    </group>
  )
}

function Door({ room }) {
  const pivot = useRef()
  const casing = useMemo(
    () => paintMaterial({ sketch: tex(`casing:${room.id}:sketch`), color: tex(`casing:${room.id}:color`), transparent: true, seed: room.z * 0.37 }),
    [room],
  )
  const leaf = useMemo(
    () => paintMaterial({ sketch: tex(`leaf:${room.id}:sketch`), color: tex(`leaf:${room.id}:color`), seed: room.z * 0.71, side: THREE.DoubleSide }),
    [room],
  )

  useFrame((_, dt) => {
    const s = useStore.getState()
    const hovered = s.hoveredDoor === room.id
    const painted = hovered || s.visited[room.id] || doors[room.id] > 0
    const speed = painted ? 0.9 : 0.6
    const reveal = casing.uniforms.uReveal.value
    const next = THREE.MathUtils.clamp(reveal + (painted ? dt : -dt) * speed, 0, 1)
    casing.uniforms.uReveal.value = leaf.uniforms.uReveal.value = next
    casing.uniforms.uHover.value = leaf.uniforms.uHover.value = damp(leaf.uniforms.uHover.value, hovered ? 1 : 0, 8, dt)
    const open = Math.max(doors[room.id], hovered ? 0.14 : 0)
    pivot.current.rotation.y = damp(pivot.current.rotation.y, open * 1.35, 6, dt)
  })

  const over = (e) => {
    e.stopPropagation()
    const s = useStore.getState()
    if (s.phase !== 'corridor' || s.hoveredDoor === room.id) return
    s.set({ hoveredDoor: room.id })
    sound.pencil()
    setCursor(true)
  }
  const out = () => {
    if (useStore.getState().hoveredDoor === room.id) useStore.getState().set({ hoveredDoor: null })
    setCursor(false)
  }
  const click = (e) => {
    e.stopPropagation()
    if (useStore.getState().phase !== 'corridor') return
    setCursor(false)
    sound.click()
    enterRoom(room.id)
  }

  return (
    <group position={[room.side * (HALF - 0.01), 0, room.z]} rotation={[0, wallRotation(room.side), 0]}>
      <mesh position={[0, DOOR.casingH / 2, 0.01]} material={casing} onPointerOver={over} onPointerOut={out} onClick={click}>
        <planeGeometry args={[DOOR.casingW, DOOR.casingH]} />
      </mesh>
      <group ref={pivot} position={[-DOOR.leafW / 2, DOOR.leafH / 2, 0.025]}>
        <mesh position={[DOOR.leafW / 2, 0, 0]} material={leaf} onPointerOver={over} onPointerOut={out} onClick={click}>
          <planeGeometry args={[DOOR.leafW, DOOR.leafH]} />
        </mesh>
      </group>
      {/* doormat */}
      <mesh position={[0, 0.006, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.3, 0.7]} />
        <meshBasicMaterial color={room.color} transparent opacity={0.28} />
      </mesh>
    </group>
  )
}

function Frame({ index, slot }) {
  const art = useMemo(
    () => paintMaterial({ sketch: tex(`art:c${index}:sketch`), color: tex(`art:c${index}:color`), seed: index * 1.618 }),
    [index],
  )
  const border = useMemo(() => new THREE.MeshBasicMaterial({ map: tex(`frame:${index % 3}`), transparent: true, alphaTest: 0.05 }), [index])
  const caption = useMemo(() => new THREE.MeshBasicMaterial({ map: tex(`caption:c${index}`), transparent: true }), [index])
  const state = useRef({ started: false, hovered: false, done: false })

  useFrame((_, dt) => {
    const st = state.current
    const d = Math.abs(view.z - slot.z)
    if (!st.started && d < 4.6 && useStore.getState().phase !== 'loading') st.started = true
    if (st.started && !st.done) {
      const v = Math.min(1, art.uniforms.uReveal.value + dt * 0.5)
      art.uniforms.uReveal.value = v
      if (v >= 1) {
        st.done = true
        useStore.getState().markRevealed(`c${index}`)
      }
    }
    art.uniforms.uHover.value = damp(art.uniforms.uHover.value, st.hovered ? 1 : 0, 8, dt)
  })

  return (
    <group position={[slot.side * (HALF - 0.02), 0, slot.z]} rotation={[0, wallRotation(slot.side), 0]}>
      <mesh position={[0, 1.88, 0.005]} material={border}>
        <planeGeometry args={[1.34, 1.95]} />
      </mesh>
      <mesh
        position={[0, 1.7, 0.012]}
        material={art}
        onPointerOver={(e) => {
          e.stopPropagation()
          state.current.hovered = true
          sound.pencil()
        }}
        onPointerOut={() => (state.current.hovered = false)}
      >
        <planeGeometry args={[1.1, 1.37]} />
      </mesh>
      <mesh position={[0, 0.8, 0.012]} material={caption}>
        <planeGeometry args={[0.8, 0.15]} />
      </mesh>
    </group>
  )
}

function Lamp({ z }) {
  const mat = useMemo(() => paintMaterial({ sketch: tex('lamp:sketch'), color: tex('lamp:color'), transparent: true, seed: z }), [z])
  const pool = useMemo(
    () => new THREE.MeshBasicMaterial({ map: tex('pool'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
    [],
  )
  useFrame((_, dt) => {
    const near = Math.abs(view.z - z) < 9
    mat.uniforms.uReveal.value = THREE.MathUtils.clamp(mat.uniforms.uReveal.value + (near ? dt : -dt) * 0.8, 0, 1)
    pool.opacity = mat.uniforms.uReveal.value * 0.9
  })
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, CORRIDOR.height - 0.5, 0]} material={mat}>
        <planeGeometry args={[0.5, 1]} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={pool}>
        <planeGeometry args={[3.4, 3.4]} />
      </mesh>
    </group>
  )
}

function Plant({ z, side }) {
  const mat = useMemo(() => paintMaterial({ sketch: tex('plant:sketch'), color: tex('plant:color'), transparent: true, seed: z * 0.3 }), [z])
  useFrame((_, dt) => {
    const near = Math.abs(view.z - z) < 5
    if (near) mat.uniforms.uReveal.value = Math.min(1, mat.uniforms.uReveal.value + dt * 0.6)
  })
  return (
    <mesh position={[side * (HALF - 0.5), 0.58, z]} material={mat}>
      <planeGeometry args={[0.7, 1.17]} />
    </mesh>
  )
}

function Banner() {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex('banner'), transparent: true, alphaTest: 0.05 }), [])
  const ref = useRef()
  useFrame(({ clock }) => {
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.8) * 0.012
  })
  return (
    <mesh ref={ref} position={[0, 2.85, -3]} material={mat}>
      <planeGeometry args={[2.9, 0.75]} />
    </mesh>
  )
}

function EndWall() {
  const mat = useMemo(() => paintMaterial({ sketch: tex('endwall:sketch'), color: tex('endwall:color'), seed: 4.2 }), [])
  const started = useRef(false)
  useFrame((_, dt) => {
    if (view.z < CORRIDOR.endZ + 6) started.current = true
    if (started.current) mat.uniforms.uReveal.value = Math.min(1, mat.uniforms.uReveal.value + dt * 0.35)
  })
  return (
    <mesh position={[0, CORRIDOR.height / 2, CORRIDOR.endWallZ]} material={mat}>
      <planeGeometry args={[CORRIDOR.width, CORRIDOR.height]} />
    </mesh>
  )
}

export default function Corridor() {
  const lamps = useMemo(() => {
    const arr = []
    for (let z = -1; z > CORRIDOR.endWallZ + 2; z -= 8) arr.push(z)
    return arr
  }, [])
  return (
    <group>
      <Surfaces />
      {rooms.map((r) => (
        <Door key={r.id} room={r} />
      ))}
      {FRAME_SLOTS.slice(0, corridorArt.length).map((slot, i) => (
        <Frame key={i} index={i} slot={slot} />
      ))}
      {lamps.map((z) => (
        <Lamp key={z} z={z} />
      ))}
      <Plant z={-2.4} side={-1} />
      <Plant z={-17} side={1} />
      <Plant z={-41} side={1} />
      <Plant z={-53.5} side={-1} />
      <Banner />
      <EndWall />
    </group>
  )
}
