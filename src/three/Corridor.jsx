import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { tex, DOOR } from '../lib/textures'
import { paintMaterial } from './PaintMaterial'
import { CORRIDOR, rooms, corridorArt, entrance } from '../data/content'
import { useStore, view, doors, portal, loopDist, loopZ } from '../store'
import { enterRoom, enterCorridor } from '../director'
import { sound } from '../lib/audio'

const HALF = CORRIDOR.width / 2
const LEN = CORRIDOR.length
const OPEN_ANGLE = 1.35
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt))

// Where the corridor pictures hang (avoiding the doors), in lap-local z
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
const LAMPS = Array.from({ length: Math.floor(LEN / 8) }, (_, i) => -1 - i * 8)
const PLANTS = [
  { z: -2.4, side: -1 },
  { z: -17, side: 1 },
  { z: -41, side: 1 },
  { z: -53.5, side: -1 },
]

const wallRotation = (side) => (side === -1 ? Math.PI / 2 : -Math.PI / 2)

// The corridor is drawn as several identical laps. Materials are shared
// between laps so a sketch painted in one lap is painted in all of them; only
// the "primary" lap runs the per-frame paint logic.
const cache = new Map()
function shared(key, make) {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key)
}
function wallMaterial(key, width, height, base = 'wall') {
  return shared(key, () => {
    const t = tex(base).clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(width / 4, height / CORRIDOR.height)
    t.needsUpdate = true
    return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })
  })
}

function setCursor(on) {
  document.body.classList.toggle('is-pointer', on)
}

function Surfaces() {
  const mats = useMemo(() => {
    const strip = (key, n) =>
      shared(key, () => {
        const t = tex(key).clone()
        t.repeat.set(1, n)
        t.needsUpdate = true
        return new THREE.MeshBasicMaterial({ map: t })
      })
    return { wall: wallMaterial('wall:lap', LEN, CORRIDOR.height), floor: strip('floor', 11), ceiling: strip('ceiling', 11) }
  }, [])
  return (
    <group>
      <mesh position={[-HALF, CORRIDOR.height / 2, -LEN / 2]} rotation={[0, Math.PI / 2, 0]} material={mats.wall}>
        <planeGeometry args={[LEN, CORRIDOR.height]} />
      </mesh>
      <mesh position={[HALF, CORRIDOR.height / 2, -LEN / 2]} rotation={[0, -Math.PI / 2, 0]} material={mats.wall}>
        <planeGeometry args={[LEN, CORRIDOR.height]} />
      </mesh>
      <mesh position={[0, 0, -LEN / 2]} rotation={[-Math.PI / 2, 0, 0]} material={mats.floor}>
        <planeGeometry args={[CORRIDOR.width, LEN]} />
      </mesh>
      <mesh position={[0, CORRIDOR.height, -LEN / 2]} rotation={[Math.PI / 2, 0, 0]} material={mats.ceiling}>
        <planeGeometry args={[CORRIDOR.width, LEN]} />
      </mesh>
    </group>
  )
}

function doorMaterials(id, seed) {
  return {
    casing: shared(`casing:${id}`, () =>
      paintMaterial({ sketch: tex(`casing:${id}:sketch`), color: tex(`casing:${id}:color`), transparent: true, seed: seed * 0.37, side: THREE.DoubleSide }),
    ),
    leaf: shared(`leaf:${id}`, () =>
      paintMaterial({ sketch: tex(`leaf:${id}:sketch`), color: tex(`leaf:${id}:color`), seed: seed * 0.71, side: THREE.DoubleSide }),
    ),
  }
}

/** Updates a door's paint + leaf angle. Paint only advances in the primary lap. */
function useDoorFrame({ id, mats, pivot, primary, painted, swing = 1 }) {
  useFrame((_, dt) => {
    const s = useStore.getState()
    const hovered = s.hoveredDoor === id
    if (primary) {
      const on = hovered || painted(s)
      const u = mats.casing.uniforms
      const next = THREE.MathUtils.clamp(u.uReveal.value + (on ? dt * 0.9 : -dt * 0.6), 0, 1)
      u.uReveal.value = mats.leaf.uniforms.uReveal.value = next
      u.uHover.value = mats.leaf.uniforms.uHover.value = damp(u.uHover.value, hovered ? 1 : 0, 8, dt)
    }
    // the director tweens doors[id] itself, so follow it exactly (the portal
    // outline is computed from the same angle); otherwise ease towards a hover peek
    if (doors[id] > 0) pivot.current.rotation.y = swing * doors[id] * OPEN_ANGLE
    else pivot.current.rotation.y = damp(pivot.current.rotation.y, hovered ? swing * 0.19 : 0, 6, dt)
  })
}

function Door({ room, offset, primary }) {
  const pivot = useRef()
  const mats = useMemo(() => doorMaterials(room.id, room.z), [room])
  // room doors swing out towards you, so the room shows in the gap beside the leaf
  useDoorFrame({ id: room.id, mats, pivot, primary, swing: -1, painted: (s) => s.visited[room.id] || doors[room.id] > 0 })

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
    enterRoom(room.id, room.z + offset)
  }

  return (
    <group position={[room.side * (HALF - 0.01), 0, room.z]} rotation={[0, wallRotation(room.side), 0]}>
      <mesh position={[0, DOOR.casingH / 2, 0.01]} material={mats.casing} onPointerOver={over} onPointerOut={out} onClick={click}>
        <planeGeometry args={[DOOR.casingW, DOOR.casingH]} />
      </mesh>
      <group ref={pivot} position={[-DOOR.leafW / 2, DOOR.leafH / 2, 0.025]}>
        <mesh position={[DOOR.leafW / 2, 0, 0]} material={mats.leaf} onPointerOver={over} onPointerOut={out} onClick={click}>
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

/** A wall across the corridor at the start of every lap, with a real doorway. */
function Entrance({ primary }) {
  const pivot = useRef()
  const mats = useMemo(() => doorMaterials(entrance.id, 7.3), [])
  useDoorFrame({ id: entrance.id, mats, pivot, primary, painted: (s) => s.entered || doors.entrance > 0 })

  const hw = DOOR.leafW / 2
  const sideW = HALF - hw
  const lintelH = CORRIDOR.height - DOOR.leafH
  const walls = useMemo(
    () => ({ side: wallMaterial('wall:entrance-side', sideW, CORRIDOR.height, 'backwall'), lintel: wallMaterial('wall:entrance-lintel', DOOR.leafW, lintelH, 'backwall') }),
    [sideW, lintelH],
  )

  const canUse = () => useStore.getState().phase === 'intro'
  const over = (e) => {
    e.stopPropagation()
    if (!canUse() || useStore.getState().hoveredDoor === entrance.id) return
    useStore.getState().set({ hoveredDoor: entrance.id })
    sound.pencil()
    setCursor(true)
  }
  const out = () => {
    if (useStore.getState().hoveredDoor === entrance.id) useStore.getState().set({ hoveredDoor: null })
    setCursor(false)
  }
  const click = (e) => {
    e.stopPropagation()
    if (!canUse()) return
    setCursor(false)
    sound.click()
    enterCorridor()
  }

  return (
    <group>
      <mesh position={[-HALF + sideW / 2, CORRIDOR.height / 2, 0]} material={walls.side}>
        <planeGeometry args={[sideW, CORRIDOR.height]} />
      </mesh>
      <mesh position={[HALF - sideW / 2, CORRIDOR.height / 2, 0]} material={walls.side}>
        <planeGeometry args={[sideW, CORRIDOR.height]} />
      </mesh>
      <mesh position={[0, DOOR.leafH + lintelH / 2, 0]} material={walls.lintel}>
        <planeGeometry args={[DOOR.leafW, lintelH]} />
      </mesh>
      {/* casing on both faces (the opening in the texture is transparent) */}
      <mesh position={[0, DOOR.casingH / 2, 0.012]} material={mats.casing} onPointerOver={over} onPointerOut={out} onClick={click}>
        <planeGeometry args={[DOOR.casingW, DOOR.casingH]} />
      </mesh>
      <mesh position={[0, DOOR.casingH / 2, -0.012]} rotation={[0, Math.PI, 0]} material={mats.casing}>
        <planeGeometry args={[DOOR.casingW, DOOR.casingH]} />
      </mesh>
      {/* the leaf swings away from you, into the corridor */}
      <group ref={pivot} position={[-hw, DOOR.leafH / 2, 0.004]}>
        <mesh position={[hw, 0, 0]} material={mats.leaf} onPointerOver={over} onPointerOut={out} onClick={click}>
          <planeGeometry args={[DOOR.leafW, DOOR.leafH]} />
        </mesh>
      </group>
      <mesh position={[0, 0.006, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 0.75]} />
        <meshBasicMaterial color={entrance.color} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

function Frame({ index, slot, primary }) {
  const art = useMemo(
    () => shared(`art:c${index}`, () => paintMaterial({ sketch: tex(`art:c${index}:sketch`), color: tex(`art:c${index}:color`), seed: index * 1.618 })),
    [index],
  )
  const border = useMemo(
    () => shared(`frame:${index % 3}`, () => new THREE.MeshBasicMaterial({ map: tex(`frame:${index % 3}`), transparent: true, alphaTest: 0.05 })),
    [index],
  )
  const caption = useMemo(() => shared(`caption:c${index}`, () => new THREE.MeshBasicMaterial({ map: tex(`caption:c${index}`), transparent: true })), [index])
  const state = useMemo(() => shared(`frame-state:${index}`, () => ({ started: false, done: false, hovered: 0 })), [index])

  useFrame((_, dt) => {
    if (!primary) return
    const st = state
    if (!st.started && loopDist(view.z, slot.z) < 4.6 && useStore.getState().phase !== 'loading') st.started = true
    if (st.started && !st.done) {
      const v = Math.min(1, art.uniforms.uReveal.value + dt * 0.5)
      art.uniforms.uReveal.value = v
      if (v >= 1) {
        st.done = true
        useStore.getState().markRevealed(`c${index}`)
      }
    }
    art.uniforms.uHover.value = damp(art.uniforms.uHover.value, st.hovered > 0 ? 1 : 0, 8, dt)
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
          state.hovered = 1
          sound.pencil()
        }}
        onPointerOut={() => (state.hovered = 0)}
      >
        <planeGeometry args={[1.1, 1.37]} />
      </mesh>
      <mesh position={[0, 0.8, 0.012]} material={caption}>
        <planeGeometry args={[0.8, 0.15]} />
      </mesh>
    </group>
  )
}

function Lamp({ z, primary }) {
  const mat = useMemo(() => shared(`lamp:${z}`, () => paintMaterial({ sketch: tex('lamp:sketch'), color: tex('lamp:color'), transparent: true, seed: z })), [z])
  const pool = useMemo(
    () =>
      shared(`pool:${z}`, () => new THREE.MeshBasicMaterial({ map: tex('pool'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })),
    [z],
  )
  useFrame((_, dt) => {
    if (!primary) return
    const near = loopDist(view.z, z) < 9
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

function Plant({ z, side, primary }) {
  const mat = useMemo(() => shared(`plant:${z}`, () => paintMaterial({ sketch: tex('plant:sketch'), color: tex('plant:color'), transparent: true, seed: z * 0.3 })), [z])
  useFrame((_, dt) => {
    if (primary && loopDist(view.z, z) < 5) mat.uniforms.uReveal.value = Math.min(1, mat.uniforms.uReveal.value + dt * 0.6)
  })
  return (
    <mesh position={[side * (HALF - 0.5), 0.58, z]} material={mat}>
      <planeGeometry args={[0.7, 1.17]} />
    </mesh>
  )
}

function Banner() {
  const mat = useMemo(() => shared('banner', () => new THREE.MeshBasicMaterial({ map: tex('banner'), transparent: true, alphaTest: 0.05 })), [])
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

function Lap({ offset, primary }) {
  return (
    <group position={[0, 0, offset]}>
      <Surfaces />
      <Entrance primary={primary} />
      {rooms.map((r) => (
        <Door key={r.id} room={r} offset={offset} primary={primary} />
      ))}
      {FRAME_SLOTS.slice(0, corridorArt.length).map((slot, i) => (
        <Frame key={i} index={i} slot={slot} primary={primary} />
      ))}
      {LAMPS.map((z) => (
        <Lamp key={z} z={z} primary={primary} />
      ))}
      {PLANTS.map((p) => (
        <Plant key={p.z} {...p} primary={primary} />
      ))}
      <Banner />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Portal: project the gap of the opening door to screen space so the HTML
// room layer can be clipped to it (you see the room *through* the door).
// Must be mounted after CameraRig so it uses this frame's camera pose.
// ---------------------------------------------------------------------------
const v = new THREE.Vector3()
const cross = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])

/** Keep the part of polygon `poly` on the same side of line a→b as point `keep`. */
function clipByLine(poly, a, b, keep) {
  const s = Math.sign(cross(a, b, keep)) || 1
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const dp = cross(a, b, p) * s
    const dq = cross(a, b, q) * s
    if (dp >= 0) out.push(p)
    if (dp * dq < 0) {
      const t = dp / (dp - dq)
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
    }
  }
  return out
}

function insideConvex(pts, x, y) {
  let sign = 0
  for (let i = 0; i < pts.length; i++) {
    const c = cross(pts[i], pts[(i + 1) % pts.length], [x, y])
    if (Math.abs(c) < 1e-6) continue
    if (sign === 0) sign = Math.sign(c)
    else if (Math.sign(c) !== sign) return false
  }
  return pts.length >= 3
}

export function PortalTracker() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useFrame(() => {
    if (!portal.active) return
    const room = rooms.find((r) => r.id === portal.id)
    if (!room) return
    camera.updateMatrixWorld()
    const phi = wallRotation(room.side)
    const px = room.side * (HALF - 0.01)
    const pz = loopZ(portal.z, view.z)
    const cos = Math.cos(phi), sin = Math.sin(phi)
    const w = DOOR.leafW, h = DOOR.leafH
    const theta = doors[room.id] * OPEN_ANGLE

    let behind = false
    const project = ([x, y, z]) => {
      v.set(px + x * cos + z * sin, y, pz - x * sin + z * cos)
      v.applyMatrix4(camera.matrixWorldInverse)
      if (v.z > -camera.near * 1.5) behind = true
      v.applyMatrix4(camera.projectionMatrix)
      return [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height]
    }
    // the doorway, and the leaf's free edge (it swings out towards the corridor)
    const opening = [[-w / 2, 0, 0.02], [-w / 2, h, 0.02], [w / 2, h, 0.02], [w / 2, 0, 0.02]].map(project)
    const fx = -w / 2 + w * Math.cos(theta)
    const fz = 0.025 + w * Math.sin(theta)
    const edgeBottom = project([fx, 0, fz])
    const edgeTop = project([fx, h, fz])
    const latch = project([w / 2, h / 2, 0.02])
    // what you can see of the room: the doorway minus the part hidden by the leaf
    const pts = theta < 1e-3 ? [] : clipByLine(opening, edgeBottom, edgeTop, latch)

    const corners = [[0, 0], [size.width, 0], [size.width, size.height], [0, size.height]]
    portal.points = pts
    portal.full = behind || corners.every(([x, y]) => insideConvex(pts, x, y))
  })
  return null
}

export default function Corridor() {
  // the lap you are in plus one behind and one ahead
  return (
    <group>
      <Lap offset={LEN} />
      <Lap offset={0} primary />
      <Lap offset={-LEN} />
    </group>
  )
}
