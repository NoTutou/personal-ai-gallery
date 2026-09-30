import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore, nav, view } from '../store'
import { CORRIDOR, rooms } from '../data/content'
import { sound } from '../lib/audio'

const clampZ = (z) => Math.max(CORRIDOR.endZ, Math.min(CORRIDOR.startZ, z))

function canWalk() {
  const s = useStore.getState()
  return s.phase === 'corridor' && !s.menuOpen && !s.panel
}

/** Wheel / touch / keyboard / mouse input for walking the corridor. */
export function useCorridorInput() {
  useEffect(() => {
    const onWheel = (e) => {
      if (!canWalk()) return
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1
      const dy = Math.max(-120, Math.min(120, e.deltaY * unit))
      nav.target = clampZ(nav.target - dy * 0.012)
    }
    let lastY = null
    const onTouchStart = (e) => {
      lastY = e.touches[0].clientY
    }
    const onTouchMove = (e) => {
      if (!canWalk() || lastY === null) return
      const y = e.touches[0].clientY
      nav.target = clampZ(nav.target - (lastY - y) * 0.025)
      lastY = y
    }
    const onTouchEnd = () => (lastY = null)
    const onKey = (e) => {
      if (!canWalk()) return
      if (['ArrowUp', 'KeyW', 'Space', 'PageDown'].includes(e.code)) nav.target = clampZ(nav.target - 2.2)
      else if (['ArrowDown', 'KeyS', 'PageUp'].includes(e.code)) nav.target = clampZ(nav.target + 2.2)
      else if (e.code === 'Home') nav.target = CORRIDOR.startZ
      else if (e.code === 'End') nav.target = CORRIDOR.endZ
      else return
      e.preventDefault()
    }
    const onMouse = (e) => {
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

export default function CameraRig() {
  const camera = useThree((s) => s.camera)
  const walk = useRef({ steps: 0, phase: 0, speed: 0 })

  useEffect(() => {
    camera.rotation.order = 'YXZ'
  }, [camera])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = useStore.getState()
    if (s.room === 'gallery') return
    const w = walk.current

    if (s.phase === 'corridor' || s.phase === 'loading' || s.phase === 'ready') {
      const prevZ = view.z
      const k = 1 - Math.exp(-3.2 * dt)
      view.z += (nav.target - view.z) * k
      view.x += (0 - view.x) * k
      const look = s.menuOpen || s.panel ? 0 : 1
      view.yaw += (-nav.mouseX * 0.2 * look - view.yaw) * (1 - Math.exp(-2.5 * dt))
      view.pitch += (-nav.mouseY * 0.07 * look - view.pitch) * (1 - Math.exp(-2.5 * dt))

      const dz = Math.abs(view.z - prevZ)
      w.speed = dz / Math.max(dt, 1e-4)
      w.steps += dz
      w.phase += dz * 2.6
      if (w.steps > 1.2) {
        w.steps = 0
        if (w.speed > 0.4) sound.step()
      }

      if (s.phase === 'corridor') {
        if (!s.hasWalked && CORRIDOR.startZ - view.z > 0.8) {
          s.set({ hasWalked: true })
          s.unlock('first-steps')
        }
        if (view.z < CORRIDOR.endZ + 1.2) s.unlock('end-of-line')
        let near = null
        for (const r of rooms) if (Math.abs(r.z - view.z) < 3.4) near = r.id
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
