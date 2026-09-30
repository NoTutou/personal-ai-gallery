// Blends a pencil sketch into its painted version with an organic,
// noise-driven brush edge that grows from the centre outwards.
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

const fragmentShader = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  uniform sampler2D uSketch;
  uniform sampler2D uColor;
  uniform float uReveal;
  uniform float uSeed;
  uniform float uTime;
  uniform float uHover;
  uniform float uOpacity;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec4 sk = texture2D(uSketch, vUv);
    vec4 co = texture2D(uColor, vUv);

    float n = fbm(vUv * 4.0 + uSeed * 7.13);
    float strokes = noise(vec2(vUv.x * 3.0 + uSeed, vUv.y * 40.0)) * 0.12; // horizontal brush streaks
    float d = distance(vUv, vec2(0.5)) * 1.25;
    float field = d * 0.65 + n * 0.55 + strokes;

    float edge = uReveal * 1.45 - 0.05;
    float m = 1.0 - smoothstep(edge - 0.06, edge + 0.02, field);
    // darker pigment pooling at the wet edge
    float rim = smoothstep(edge - 0.14, edge - 0.02, field) * m;

    vec3 col = mix(sk.rgb, co.rgb, m);
    col *= 1.0 - rim * 0.22;
    col += uHover * 0.035;

    float alpha = mix(sk.a, co.a, m) * uOpacity;
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`

export function createPaintMaterial({ sketch, color, seed = Math.random(), transparent = false, side = THREE.FrontSide }) {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uSketch: { value: null },
        uColor: { value: null },
        uReveal: { value: 0 },
        uSeed: { value: seed },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uOpacity: { value: 1 },
      },
    ]),
    vertexShader,
    fragmentShader,
    fog: true,
    transparent,
    side,
  })
}

/** Assign textures after creation (UniformsUtils.merge clones textures otherwise). */
export function paintMaterial(opts) {
  const m = createPaintMaterial(opts)
  m.uniforms.uSketch.value = opts.sketch
  m.uniforms.uColor.value = opts.color
  return m
}
