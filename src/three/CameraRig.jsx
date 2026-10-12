import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore, nav, view, loopDist, loopZ } from '../store'
import { CORRIDOR, rooms } from '../data/content'
import { sound } from '../lib/audio'

const LEN = CORRIDOR.length
// how far you can look around with the mouse (radians at the screen edge)
const LOOK_YAW = 0.9
const LOOK_PITCH = 0.3
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

function canWalk() {
  const s = useStore.getState()
  return s.phase === 'corridor' && !s.menuOpen && !s.panel
}

function walk(dz) {
  nav.target += dz
  const s = useStore.getState()
  if (!s.hasWalked) {
    s.set({ hasWalked: true })
    s.unlock('first-steps')
  }
}

/** Wheel / touch / keyboard / mouse input for walking the corridor. */
export function useCorridorInput() {
  useEffect(() => {
    const onWheel = (e) => {
      if (!canWalk()) return
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1
      const dy = clamp(e.deltaY * unit, -120, 120)
      walk(-dy * 0.012)
    }
    let last = null
    const onTouchStart = (e) => {
      last = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onTouchMove = (e) => {
      if (!last) return
      const t = e.touches[0]
      // horizontal drag turns your head, vertical drag walks
      nav.mouseX = clamp(nav.mouseX - ((t.clientX - last.x) / window.innerWidth) * 2.4, -1, 1)
      if (canWalk()) walk(-(last.y - t.clientY) * 0.025)
      last = { x: t.clientX, y: t.clientY }
    }
    const onTouchEnd = () => (last = null)
    const onKey = (e) => {
      if (!canWalk()) return
      if (['ArrowUp', 'KeyW', 'Space', 'PageDown'].includes(e.code)) walk(-2.2)
      else if (['ArrowDown', 'KeyS', 'PageUp'].includes(e.code)) walk(2.2)
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') nav.mouseX = clamp(nav.mouseX - 0.35, -1, 1)
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') nav.mouseX = clamp(nav.mouseX + 0.35, -1, 1)
      else if (e.code === 'Home') nav.target = loopZ(CORRIDOR.entryZ, view.z)
      else if (e.code === 'End') nav.target = loopZ(CORRIDOR.entryZ - LEN + 5, view.z)
      else return
      e.preventDefault()
    }
    const onMouse = (e) => {
      if (e.pointerType === 'touch') return
      nav.mouseX = (e.clientX / window.innerWidth) * 2 - 1
      nav.mouseY = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointermove', onMouse)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointermove', onMouse)
    }
  }, [])
}

/** Shift camera + target by whole laps so the numbers stay small (invisible: the laps are identical). */
function wrapLap(s) {
  let shift = 0
  if (view.z < -LEN) shift = LEN
  else if (view.z > 4) shift = -LEN
  if (!shift) return
  view.z += shift
  nav.target += shift
  if (shift > 0) s.unlock('end-of-line')
}

export default function CameraRig() {
  const camera = useThree((s) => s.camera)
  const walkState = useRef({ steps: 0, phase: 0, speed: 0 })

  useEffect(() => {
    camera.rotation.order = 'YXZ'
  }, [camera])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = useStore.getState()
    const w = walkState.current

    if (s.phase === 'corridor' || s.phase === 'intro' || s.phase === 'loading' || s.phase === 'ready') {
      const prevZ = view.z
      const k = 1 - Math.exp(-3.2 * dt)
      view.z += (nav.target - view.z) * k
      view.x += (0 - view.x) * k
      const look = s.menuOpen || s.panel ? 0 : 1
      const lk = 1 - Math.exp(-7 * dt)
      view.yaw += (-nav.mouseX * LOOK_YAW * look - view.yaw) * lk
      view.pitch += (-nav.mouseY * LOOK_PITCH * look - view.pitch) * lk

      const dz = Math.abs(view.z - prevZ)
      w.speed = dz / Math.max(dt, 1e-4)
      w.steps += dz
      w.phase += dz * 2.6
      if (w.steps > 1.2) {
        w.steps = 0
        if (w.speed > 0.4) sound.step()
      }

      if (s.phase === 'corridor') {
        wrapLap(s)
        let near = null
        for (const r of rooms) if (loopDist(view.z, r.z) < 3.4) near = r.id
        if (near !== s.nearDoor) s.set({ nearDoor: near })
      }
    } else {
      w.speed *= 0.9
      w.phase += dt * 3 * Math.min(1, w.speed)
    }

    const bob = Math.sin(w.phase) * 0.028 * Math.min(1, w.speed / 2)
    camera.position.set(view.x, view.y + bob, view.z)
    camera.rotation.set(view.pitch, view.yaw, Math.sin(w.phase * 0.5) * 0.004 * Math.min(1, w.speed / 2))
  })

  return null
}
