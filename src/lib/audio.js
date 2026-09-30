// Tiny WebAudio engine. Every sound is synthesised – no audio files needed.

class SoundEngine {
  ctx = null
  master = null
  music = null
  sfx = null
  noiseBuf = null
  ambientNodes = []
  chordTimer = null
  enabled = true
  volumes = { master: 0.8, music: 0.5, sfx: 0.7 }

  init() {
    if (this.ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.music = this.ctx.createGain()
    this.sfx = this.ctx.createGain()
    this.music.connect(this.master)
    this.sfx.connect(this.master)
    this.master.connect(this.ctx.destination)
    this.applyVolumes()

    const len = this.ctx.sampleRate * 2
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = this.noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  }

  resume() {
    this.init()
    if (this.ctx?.state === 'suspended') this.ctx.resume()
  }

  setEnabled(on) {
    this.enabled = on
    this.applyVolumes()
    if (on) {
      this.resume()
      this.startAmbient()
    }
  }

  setVolumes(v) {
    this.volumes = { ...this.volumes, ...v }
    this.applyVolumes()
  }

  applyVolumes() {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const on = this.enabled ? 1 : 0
    this.master.gain.setTargetAtTime(this.volumes.master * on, t, 0.08)
    this.music.gain.setTargetAtTime(this.volumes.music, t, 0.08)
    this.sfx.gain.setTargetAtTime(this.volumes.sfx, t, 0.08)
  }

  // ---- building blocks -----------------------------------------------------
  noise({ dur = 0.2, type = 'bandpass', freq = 1000, q = 1, gain = 0.3, attack = 0.005, freqEnd, at = 0, dest }) {
    if (!this.ctx || !this.enabled) return
    const t = this.ctx.currentTime + at
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuf
    const f = this.ctx.createBiquadFilter()
    f.type = type
    f.frequency.setValueAtTime(freq, t)
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur)
    f.Q.value = q
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g).connect(dest || this.sfx)
    src.start(t, Math.random() * 1.5)
    src.stop(t + dur + 0.05)
    return g
  }

  tone({ freq = 440, type = 'sine', dur = 0.3, gain = 0.2, at = 0, freqEnd, dest }) {
    if (!this.ctx || !this.enabled) return
    const t = this.ctx.currentTime + at
    const o = this.ctx.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(dest || this.sfx)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  // ---- sound effects ---------------------------------------------------------
  step() {
    this.noise({ dur: 0.13, type: 'lowpass', freq: 260 + Math.random() * 120, q: 0.7, gain: 0.35 })
    this.noise({ dur: 0.05, type: 'bandpass', freq: 1800, q: 2, gain: 0.05 })
  }

  pencil() {
    for (let i = 0; i < 3; i++) this.noise({ dur: 0.06, type: 'highpass', freq: 3500 + Math.random() * 1500, gain: 0.05 + Math.random() * 0.04, at: i * 0.05 })
  }

  click() {
    this.tone({ freq: 700, freqEnd: 420, type: 'triangle', dur: 0.08, gain: 0.12 })
    this.noise({ dur: 0.03, type: 'highpass', freq: 4000, gain: 0.05 })
  }

  paper() {
    this.noise({ dur: 0.45, type: 'bandpass', freq: 600, freqEnd: 2600, q: 0.8, gain: 0.16, attack: 0.05 })
  }

  tear() {
    if (!this.ctx || !this.enabled) return
    for (let i = 0; i < 22; i++) {
      this.noise({ dur: 0.05 + Math.random() * 0.06, type: 'bandpass', freq: 900 + Math.random() * 2600, q: 1.5, gain: 0.08 + Math.random() * 0.12, at: i * 0.035 + Math.random() * 0.02 })
    }
    this.noise({ dur: 0.9, type: 'lowpass', freq: 400, gain: 0.12, attack: 0.1 })
  }

  creak() {
    if (!this.ctx || !this.enabled) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(110, t)
    o.frequency.linearRampToValueAtTime(160, t + 0.35)
    o.frequency.linearRampToValueAtTime(95, t + 0.8)
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 23
    const lg = this.ctx.createGain()
    lg.gain.value = 18
    lfo.connect(lg).connect(o.frequency)
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 700
    f.Q.value = 4
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.1)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    o.connect(f).connect(g).connect(this.sfx)
    o.start(t)
    lfo.start(t)
    o.stop(t + 1)
    lfo.stop(t + 1)
  }

  chime() {
    this.tone({ freq: 784, dur: 0.5, gain: 0.12 })
    this.tone({ freq: 1175, dur: 0.7, gain: 0.1, at: 0.12 })
    this.tone({ freq: 1568, dur: 0.9, gain: 0.06, at: 0.24 })
  }

  // ---- ambient music ---------------------------------------------------------
  startAmbient() {
    if (!this.ctx || this.ambientNodes.length) return
    const ctx = this.ctx
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    const bus = ctx.createGain()
    bus.gain.value = 0.0001
    bus.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 4)
    filter.connect(bus).connect(this.music)

    const voices = []
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator()
      o.type = i % 2 ? 'triangle' : 'sine'
      o.detune.value = (Math.random() - 0.5) * 12
      const g = ctx.createGain()
      g.gain.value = 0.05
      o.connect(g).connect(filter)
      o.start()
      voices.push(o)
    }
    // slow tremolo
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.12
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 250
    lfo.connect(lfoGain).connect(filter.frequency)
    lfo.start()

    // room tone
    const room = ctx.createBufferSource()
    room.buffer = this.noiseBuf
    room.loop = true
    const rf = ctx.createBiquadFilter()
    rf.type = 'lowpass'
    rf.frequency.value = 350
    const rg = ctx.createGain()
    rg.gain.value = 0.025
    room.connect(rf).connect(rg).connect(this.music)
    room.start()

    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 329.63], // G6
    ]
    let idx = 0
    const play = () => {
      const t = ctx.currentTime
      chords[idx % chords.length].forEach((f, i) => voices[i].frequency.setTargetAtTime(f / 2, t, 1.2))
      idx++
    }
    play()
    this.chordTimer = setInterval(play, 7000)
    this.ambientNodes = [...voices, lfo, room]
  }
}

export const sound = new SoundEngine()
