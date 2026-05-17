import * as THREE from 'three';

export function createWater(scene) {
  const waterGeo = new THREE.PlaneGeometry(400, 400, 120, 120);
  const waterMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:    { value: 0 },
      uDeep:    { value: new THREE.Color(0x031840) },
      uMid:     { value: new THREE.Color(0x0a4070) },
      uShallow: { value: new THREE.Color(0x1a7090) },
      uFoam:    { value: new THREE.Color(0xc8e8f5) },
      uSun:     { value: new THREE.Vector3(0.5, 0.8, 0.3) },
    },
    vertexShader: `
      uniform float uTime;
      varying vec2  vUv;
      varying float vHeight;
      varying vec3  vNormal;
      varying vec3  vWorldPos;

      void main() {
        vUv = uv;
        vec3 pos = position;
        float t = uTime;
        float y = 0.0;
        y += sin(pos.x * 0.08 + pos.y * 0.05 + t * 0.80) * 0.28;
        y += sin(pos.x * 0.13 - pos.y * 0.09 + t * 1.00) * 0.20;
        y += sin(pos.x * 0.05 + pos.y * 0.14 + t * 0.65) * 0.22;
        y += sin(pos.x * 0.20 + pos.y * 0.07 - t * 1.10) * 0.12;
        y += sin(pos.x * 0.07 - pos.y * 0.18 + t * 0.90) * 0.14;
        y += sin(pos.x * 0.25 + pos.y * 0.20 + t * 1.30) * 0.07;
        y += sin(pos.x * 0.04 + pos.y * 0.03 + t * 0.50) * 0.18;
        y += sin(pos.x * 0.18 - pos.y * 0.12 - t * 0.75) * 0.09;
        pos.z = y;
        vHeight = y;
        vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
        float e = 0.5;
        float yx = sin((pos.x+e)*0.08+pos.y*0.05+t*0.80)*0.28 + sin((pos.x+e)*0.13-pos.y*0.09+t*1.00)*0.20
                 + sin((pos.x+e)*0.05+pos.y*0.14+t*0.65)*0.22 + sin((pos.x+e)*0.20+pos.y*0.07-t*1.10)*0.12
                 + sin((pos.x+e)*0.07-pos.y*0.18+t*0.90)*0.14 + sin((pos.x+e)*0.04+pos.y*0.03+t*0.50)*0.18;
        float yy = sin(pos.x*0.08+(pos.y+e)*0.05+t*0.80)*0.28 + sin(pos.x*0.13-(pos.y+e)*0.09+t*1.00)*0.20
                 + sin(pos.x*0.05+(pos.y+e)*0.14+t*0.65)*0.22 + sin(pos.x*0.20+(pos.y+e)*0.07-t*1.10)*0.12
                 + sin(pos.x*0.07-(pos.y+e)*0.18+t*0.90)*0.14 + sin(pos.x*0.04+(pos.y+e)*0.03+t*0.50)*0.18;
        vNormal = normalize(vec3(-(yx-y)/e, 1.0, -(yy-y)/e));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3  uDeep;
      uniform vec3  uMid;
      uniform vec3  uShallow;
      uniform vec3  uFoam;
      uniform vec3  uSun;
      uniform float uTime;
      varying vec2  vUv;
      varying float vHeight;
      varying vec3  vNormal;
      varying vec3  vWorldPos;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)),f.x), f.y);
      }

      void main() {
        vec3 n = normalize(vNormal);
        float depth = (vHeight + 0.9) / 1.8;
        vec3 col = mix(uDeep, uMid, smoothstep(0.0, 0.5, depth));
        col = mix(col, uShallow, smoothstep(0.5, 1.0, depth));
        float foam = smoothstep(0.78, 1.0, depth);
        float fn = noise(vUv * 22.0 + uTime * 0.4);
        col = mix(col, uFoam, foam * fn * 0.35);
        vec3 viewDir = normalize(vec3(0.0, 6.0, 12.0) - vWorldPos);
        vec3 halfV = normalize(uSun + viewDir);
        float spec = pow(max(dot(n, halfV), 0.0), 180.0);
        col += vec3(1.0, 0.97, 0.9) * spec * 0.9;
        float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 4.0);
        col = mix(col, uShallow, fresnel * 0.12);
        gl_FragColor = vec4(col, 0.95);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = true;
  scene.add(water);

  return waterMat; // return for time update in main loop
}
