// The bathroom: procedural rounded tiles, frosted window in a real wall opening (the sun pours a
// window-shaped patch onto the tub), floor, the Blender props (assets/props.glb), candle flames,
// lights and the three moods.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { buildTubGeometry } from './tubgeo.js';
import { woodTexture, terryTexture, terryBump } from './textures.js';
import { GLSL_NOISE } from './glsl.js';

export const WALL_Z = -0.62;
export const WIN = { x0: -0.72, x1: 0.32, y0: 1.04, y1: 1.98, depth: 0.16 };

// --- tiles: small rounded glazed tiles with grout, per-tile tone + gloss variation
function tileMaterial({ tile = 0.075, tileH = 0.075, base = '#efe9df', grout = '#d4cbbf', axis = 'xy', tint = 0.05 } = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.16, clearcoat: 0.6, clearcoatRoughness: 0.12 });
  const u = { uTile: { value: new THREE.Vector2(tile, tileH) }, uBase: { value: new THREE.Color(base) }, uGrout: { value: new THREE.Color(grout) }, uTint: { value: tint } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvTW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform vec2 uTile; uniform vec3 uBase, uGrout; uniform float uTint; varying vec3 vTW;
      ${GLSL_NOISE}
      vec2 tUV; vec2 tId; float tEdge; vec2 tGrad;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      {
        vec2 p = ${axis === 'xy' ? 'vTW.xy' : axis === 'zy' ? 'vTW.zy' : 'vTW.xz'};
        // running bond on alternate rows
        float row = floor(p.y / uTile.y);
        p.x += mod(row, 2.0) * 0.5 * uTile.x;
        tId = floor(p / uTile);
        tUV = fract(p / uTile) - 0.5;
        vec2 hs = 0.5 - vec2(0.0018) / uTile;       // half size minus half grout
        vec2 q = abs(tUV) / hs;
        float sd = pow(pow(q.x, 8.0) + pow(q.y, 8.0), 1.0 / 8.0); // rounded square
        tEdge = smoothstep(1.0, 0.94, sd);
        tGrad = sign(tUV) * pow(q, vec2(5.0)) * smoothstep(0.75, 1.0, sd);
        float h = hash12(tId + 3.7);
        vec3 c = uBase * (1.0 - uTint + uTint * 2.0 * h);
        c *= 1.0 + 0.04 * (vnoise(p * 60.0) - 0.5);
        // glaze pooling: slightly deeper colour at the tile edges
        c *= mix(0.94, 1.0, smoothstep(0.98, 0.7, sd));
        diffuseColor.rgb = mix(uGrout, c, tEdge);
      }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = mix(0.85, 0.08 + 0.12 * hash12(tId + 9.1), tEdge);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      {
        // pillowed tile surface: tilt the normal near the rounded edges, plus a faint glaze wave
        vec3 tg = vec3(tGrad * 0.6, 0.0);
        tg.xy += 0.02 * (vec2(vnoise(tUV * 6.0 + tId), vnoise(tUV * 6.0 + tId + 5.0)) - 0.5);
        vec3 wn = ${axis === 'xy' ? 'vec3(tg.x, tg.y, 0.0)' : axis === 'zy' ? 'vec3(0.0, tg.y, tg.x)' : 'vec3(tg.x, 0.0, tg.y)'};
        normal = normalize(normal + (viewMatrix * vec4(wn, 0.0)).xyz * tEdge);
      }`);
  };
  m.customProgramCacheKey = () => 'tile-' + axis + tile + tileH;
  return m;
}

function floorMaterial() {
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.3 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvTW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vTW;
      ${GLSL_NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      {
        // warm limestone in 60 cm slabs with fine fossil speckle
        vec2 p = vTW.xz;
        vec2 id = floor(p / 0.6);
        vec2 f = abs(fract(p / 0.6) - 0.5);
        float grout = smoothstep(0.497, 0.4985, max(f.x, f.y));
        float h = hash12(id);
        vec3 c = vec3(0.80, 0.74, 0.66) * (0.94 + 0.08 * h);
        c *= 0.93 + 0.1 * fbm2(p * 3.0 + id);
        c = mix(c, c * 0.82, smoothstep(0.7, 0.75, vnoise(p * 140.0)) * 0.5);
        diffuseColor.rgb = mix(c, vec3(0.62, 0.57, 0.5), grout);
      }`);
  };
  return m;
}

// frosted glass: bright, softly graded, a hint of texture; emissive so it reads as the light source
function frostedMaterial() {
  const u = { uTop: { value: new THREE.Color(5, 5, 5) }, uBot: { value: new THREE.Color(4, 4, 4) }, uGlow: { value: 1 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vW,1.0); }',
    fragmentShader: `uniform vec3 uTop, uBot; uniform float uGlow; varying vec2 vUv; varying vec3 vW;
      ${GLSL_NOISE}
      void main(){
        vec3 c = mix(uBot, uTop, smoothstep(0.0, 1.0, vUv.y));
        // a soft blob where the sun sits behind the glass + reeded texture
        c *= 0.9 + 0.12 * sin(vW.x * 420.0);
        c *= 0.92 + 0.16 * vnoise(vW.xy * 9.0);
        c += uTop * 0.5 * exp(-dot(vUv - vec2(0.3, 0.75), vUv - vec2(0.3, 0.75)) * 6.0);
        gl_FragColor = vec4(c * uGlow, 1.0);
      }`,
  });
  m.userData.u = u;
  return m;
}

export const MOOD_SETTINGS = {
  morning: {
    sunCol: 0xfff4e6, sunI: 3.0, sunDir: [-0.15, 0.75, -0.64], hemiSky: 0xe6eef8, hemiGround: 0xcbb8a6, hemiI: 0.45, envI: 0.6,
    winTop: [3.6, 3.75, 4.0], winBot: [2.8, 2.85, 3.05], winCol: 0xf4f7ff, winI: 9, exposure: 1.0, bg: 0xece6df, candles: 0.25, steam: 0.5, sparkle: 1.0,
    waterSky: [0.70, 0.74, 0.80], bounce: [0.62, 0.58, 0.54],
  },
  golden: {
    sunCol: 0xff9a45, sunI: 4.4, sunDir: [-0.32, 0.70, -0.64], hemiSky: 0xe9b98e, hemiGround: 0x9c6a48, hemiI: 0.24, envI: 0.45,
    winTop: [5.2, 3.0, 1.3], winBot: [3.6, 1.8, 0.7], winCol: 0xffa860, winI: 7, exposure: 1.0, bg: 0xe2bf9c, candles: 0.6, steam: 0.85, sparkle: 1.3,
    waterSky: [0.55, 0.40, 0.30], bounce: [0.70, 0.45, 0.26],
  },
  night: {
    sunCol: 0xd2e3ed, sunI: 2.5, sunDir: [-0.15, 0.75, -0.64], hemiSky: 0x88b3bd, hemiGround: 0x273b30, hemiI: 0.7, envI: 0.65,
    winTop: [0.05, 0.075, 0.17], winBot: [0.025, 0.04, 0.09], winCol: 0x9cd4cf, winI: 2.5, exposure: 1.15, bg: 0x101e21, candles: 0.8, steam: 0.7, sparkle: 1.0,
    waterSky: [0.36, 0.43, 0.49], bounce: [0.24, 0.29, 0.30],
  },
};

export class Room {
  constructor(scene, renderer, opts = {}) {
    this.scene = scene;
    this.r = renderer;
    this.areaLight = !!opts.areaLight;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.flames = [];
    this.candleLights = [];
    this.anchors = {};
    this.buildShell();
    this.buildLights();
    this.fallbackTub();
  }

  buildShell() {
    const g=this.group;
    const stone = new THREE.MeshStandardMaterial({color:0x243a38,roughness:.86});
    stone.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vStone;').replace('#include <begin_vertex>','#include <begin_vertex>\nvStone=position;');sh.fragmentShader=sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vStone;\n'+GLSL_NOISE).replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb *= .78 + .28 * fbm2(vStone.xz*14.0) + .07*vnoise(vStone.xz*150.0);');};
    this.stone=stone;
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(20,20),stone);ground.rotation.x=-Math.PI/2;ground.position.y=-.015;ground.receiveShadow=true;g.add(ground);
    // Broad stepping stones, interrupted by fine dark joints.
    const slabMat=new THREE.MeshStandardMaterial({color:0x30423c,roughness:.9});
    for(let j=0;j<6;j++)for(let i=0;i<9;i++){
      const slab=new THREE.Mesh(new THREE.BoxGeometry(.49,.025,.40),slabMat);slab.position.set((i-4)*.50+(j%2)*.25,0,(j-2)*.41);slab.receiveShadow=true;g.add(slab);
    }
    // Night sky with a textured disc, behind the garden.
    this.glassMat=frostedMaterial();this.winScale=.085;this.sillTop=1.04;
    const moon=new THREE.Mesh(new THREE.CircleGeometry(.18,64),new THREE.ShaderMaterial({vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv;${GLSL_NOISE} void main(){float n=fbm2(vUv*18.);vec3 c=vec3(.78,.86,.72)*(.85+.15*n);float d=length(vUv-.5);gl_FragColor=vec4(c*1.4,1.);}`}));moon.position.set(.30,.32,-1.5);moon.rotation.x=-.85;moon.visible=false;g.add(moon);
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.6),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv;void main(){float a=exp(-length(vUv-.5)*10.);gl_FragColor=vec4(.32,.48,.39,a*.18);}'}));glow.rotation.x=-.85;glow.position.copy(moon.position);glow.position.z-=.02;glow.visible=false;g.add(glow);
    // Layered hills across the horizon.
    for(let k=0;k<3;k++){
      const shape=new THREE.Shape();shape.moveTo(-6,-1);shape.lineTo(-6,.2);for(let i=0;i<=48;i++){const x=-6+i/4;shape.lineTo(x,.2+Math.sin(x*1.5+k)*.18+Math.sin(x*3.2+k)*.06);}shape.lineTo(6,-1);shape.closePath();
      const hill=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:[0x142a2b,0x102426,0x0c2020][k]}));hill.position.set(0,.7-k*.15,-3+k*.25);g.add(hill);
    }
    // Bamboo silhouettes flank the pool.
    const bamboo=new THREE.MeshStandardMaterial({color:0x274b38,roughness:.85});
    const leaves=new THREE.MeshStandardMaterial({color:0x2d5440,roughness:.8,side:THREE.DoubleSide});
    for(let side of [-1,1])for(let i=0;i<7;i++){
      const x=side*(1.0+i*.12),z=-.8-(i%3)*.18,h=1.2+(i%4)*.19;
      const stalk=new THREE.Mesh(new THREE.CylinderGeometry(.012,.018,h,7),bamboo);stalk.position.set(x,h/2,z);stalk.rotation.z=side*(i%3)*.04;stalk.castShadow=true;g.add(stalk);
      for(let j=1;j<6;j++){
        const node=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.014,8),bamboo);node.position.set(x,h*j/6,z);g.add(node);
        if(j>2)for(let n=0;n<4;n++){
          const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),leaves);leaf.scale.set(.11,.005,.018);leaf.position.set(x+Math.cos(n*2+j)*.12,h*j/6+Math.sin(n)*.06,z+.02+n*.02);leaf.rotation.z=Math.sin(n+j)*.6;leaf.rotation.y=n;g.add(leaf);
        }
      }
    }
    // A low platform grounds the sculpted stone pool.
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.13,1.18,.07,80),new THREE.MeshStandardMaterial({color:0x152725,roughness:.9}));base.scale.z=.57;base.position.y=.025;base.receiveShadow=true;g.add(base);
    this.scene.fog=new THREE.FogExp2(0x101e21,.085);
  }

  buildLights() {
    const sun = new THREE.DirectionalLight(0xffffff, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -1.9, right: 1.9, top: 1.9, bottom: -1.9, near: 0.3, far: 9 });
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.015; sun.shadow.radius = 6; sun.shadow.blurSamples = 12;
    sun.target.position.set(0, 0.45, 0.1);
    this.scene.add(sun, sun.target);
    this.sun = sun;
    // the frosted window itself: a soft area light that models everything with gentle daylight
    // (high quality: a true area light; otherwise a soft directional fill from the window)
    let win;
    if (this.areaLight) {
      RectAreaLightUniformsLib.init();
      win = new THREE.RectAreaLight(0xffffff, 8, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
      win.position.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, WALL_Z - 0.05);
      win.lookAt((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2 - 0.35, 1.0);
      this.winScale = 1;
    } else {
      win = new THREE.DirectionalLight(0xffffff, 1);
      win.position.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2 + 0.2, WALL_Z - 0.3);
      win.target.position.set(0.1, 0.3, 1.2);
      this.scene.add(win.target);
      this.winScale = 0.085;
    }
    this.scene.add(win);
    this.winLight = win;
    const hemi = new THREE.HemisphereLight(0xe6eef8, 0xcbb8a6, 0.8);
    this.scene.add(hemi);
    this.hemi = hemi;
    // a soft fill bouncing from the room in front (where the camera is)
    const fill = new THREE.PointLight(0xfff1e2, 0.0, 6, 2);
    fill.position.set(0.6, 1.9, 2.2);
    this.scene.add(fill);
    this.fill = fill;
  }

  fallbackTub() {
    const enamel = new THREE.MeshPhysicalMaterial({ color: 0x45605b, roughness: 0.7, clearcoat: 0.18, clearcoatRoughness: 0.4 });
    enamel.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vStone;').replace('#include <begin_vertex>','#include <begin_vertex>\nvStone=position;');sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vStone;\n'+GLSL_NOISE).replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb *= .75 + .32*fbm2(vStone.xz*26.) + .10*vnoise(vStone.xy*160.);');};
    this.enamel = enamel;
    const tub = new THREE.Mesh(buildTubGeometry(), enamel);
    tub.material.side = THREE.DoubleSide;
    tub.castShadow = true; tub.receiveShadow = true;
    this.tub = tub;
    this.group.add(tub);
  }

  async loadProps(url) {
    let gltf;
    try { gltf = await new GLTFLoader().loadAsync(url); } catch (e) { console.warn('props.glb not loaded, using fallback tub', e); return false; }
    const root = gltf.scene;
    const wood = woodTexture();
    const mats = {
      Enamel: this.enamel,
      Brass: new THREE.MeshPhysicalMaterial({ color: 0xd9a95a, metalness: 1, roughness: 0.22, clearcoat: 0.3 }),
      Chrome: new THREE.MeshStandardMaterial({ color: 0xf0f0f0, metalness: 1, roughness: 0.08 }),
      Wax: new THREE.MeshPhysicalMaterial({ color: 0xf3e6cf, roughness: 0.55, transmission: 0, sheen: 0.4, sheenColor: new THREE.Color(0xfff0d8) }),
      Wick: new THREE.MeshStandardMaterial({ color: 0x2a1d14, roughness: 0.9 }),
      CandleGlass: new THREE.MeshPhysicalMaterial({ color: 0xd99a4a, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.55 }),
      Leaf: new THREE.MeshPhysicalMaterial({ color: 0x3f8a3a, roughness: 0.45, sheen: 0.3, side: THREE.DoubleSide }),
      Stem: new THREE.MeshStandardMaterial({ color: 0x4e7a32, roughness: 0.7 }),
      Soil: new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 1 }),
      Pot: new THREE.MeshPhysicalMaterial({ color: 0xece4d8, roughness: 0.5, clearcoat: 0.4 }),
      Terry: new THREE.MeshStandardMaterial({ color: 0xffffff, map: terryTexture(), bumpMap: terryBump(), bumpScale: 1.4, roughness: 0.95 }),
      Wood: new THREE.MeshStandardMaterial({ color: 0x587061, map: wood, roughness: 0.75 }),
      DuckRubber: new THREE.MeshPhysicalMaterial({ color: 0xffcf1f, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
      DuckBeak: new THREE.MeshPhysicalMaterial({ color: 0xff7a12, roughness: 0.4, clearcoat: 0.4 }),
      DuckEye: new THREE.MeshPhysicalMaterial({ color: 0x0c0c0c, roughness: 0.1, clearcoat: 1 }),
      Plinth: new THREE.MeshStandardMaterial({ color: 0x3b3835, roughness: 0.7 }),
    };
    this.mats = mats;
    const toAdd = [];
    root.traverse((o) => {
      if (o.isMesh) {
        const name = o.material?.name?.replace(/\.\d+$/, '');
        if (mats[name]) o.material = mats[name];
        o.castShadow = true; o.receiveShadow = true;
      }
      if (/_Flame$/.test(o.name)) this.anchors[o.name] = o;
    });
    for (const child of [...root.children]) {
      if (['Plant','Stool','Towel','Duck'].includes(child.name)) { root.remove(child); continue; }
      if (child.name === 'DuckToy') { this.duckToy = child; root.remove(child); continue; }
      toAdd.push(child);
    }
    for (const c of toAdd) { this.group.add(c); this[c.name] = c; }
    if (this.Tub) { this.group.remove(this.tub); this.tub = this.Tub; }
    this.group.updateMatrixWorld(true);
    // candle flames at the flame anchors
    for (const [name, a] of Object.entries(this.anchors)) this.addFlame(a.getWorldPosition(new THREE.Vector3()), name);
    return true;
  }

  addFlame(pos, name) {
    const u = { uTime: { value: 0 }, uSeed: { value: Math.random() * 10 }, uI: { value: 1 } };
    const m = new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform float uTime, uSeed; varying vec2 vUv;
        void main(){ vUv = uv;
          vec3 c = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
          float sway = sin(uTime * 7.0 + uSeed) * 0.15 + sin(uTime * 13.0 + uSeed * 2.0) * 0.06;
          vec3 p = c + right * (position.x + sway * position.y * 0.6) * 0.016 + vec3(0.0, 1.0, 0.0) * (position.y + 0.5) * 0.04;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform float uTime, uSeed, uI; varying vec2 vUv;
        void main(){
          vec2 q = vUv - vec2(0.5, 0.0);
          float w = mix(0.42, 0.06, pow(vUv.y, 1.2));
          float d = abs(q.x) / w;
          float body = smoothstep(1.0, 0.3, d) * smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
          float core = smoothstep(0.6, 0.0, d) * smoothstep(0.02, 0.15, vUv.y) * smoothstep(0.6, 0.2, vUv.y);
          vec3 col = vec3(1.0, 0.55, 0.16) * body * 2.5 + vec3(1.0, 0.86, 0.6) * core * 5.0;
          float blue = smoothstep(0.25, 0.0, vUv.y) * smoothstep(0.9, 0.2, d) * 0.6;
          col += vec3(0.2, 0.35, 1.0) * blue;
          float fl = 0.85 + 0.15 * sin(uTime * 17.0 + uSeed * 3.0);
          gl_FragColor = vec4(col * fl * uI, 1.0);
        }`,
    });
    const flame = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
    flame.position.copy(pos);
    flame.frustumCulled = false;
    flame.renderOrder = 20;
    this.group.add(flame);
    const light = new THREE.PointLight(0xff9a4a, 0, 3.0, 2);
    light.position.copy(pos).add(new THREE.Vector3(0, 0.03, 0));
    this.group.add(light);
    this.flames.push({ mesh: flame, u, light, name, base: pos.clone() });
  }

  setMood(name, waterUniforms) {
    const M = MOOD_SETTINGS[name];
    this.mood = name;
    const d = new THREE.Vector3(...M.sunDir).normalize();
    // sunDir points from the tub toward the sun (behind the window wall)
    this.sun.position.copy(this.sun.target.position).addScaledVector(d, 4.0);
    this.sun.color.set(M.sunCol); this.sun.intensity = M.sunI; this.sun.visible = M.sunI > 0;
    this.hemi.color.set(M.hemiSky); this.hemi.groundColor.set(M.hemiGround); this.hemi.intensity = M.hemiI;
    this.winLight.color.set(M.winCol); this.winLight.intensity = M.winI * this.winScale;
    this.glassMat.userData.u.uTop.value.setRGB(...M.winTop); this.glassMat.userData.u.uBot.value.setRGB(...M.winBot);
    this.candleLevel = M.candles;
    this.M = M;
    if (waterUniforms) {
      const sc = new THREE.Color(M.sunCol);
      waterUniforms.uSunCol.value.set(sc.r, sc.g, sc.b).multiplyScalar(M.sunI);
      waterUniforms.uSkyCol.value.set(...M.waterSky);
      waterUniforms.uBounceCol.value.set(...M.bounce);
    }
  }

  update(t, dt) {
    for (const f of this.flames) {
      f.u.uTime.value = t;
      const fl = 0.82 + 0.1 * Math.sin(t * 11 + f.u.uSeed.value) + 0.08 * Math.sin(t * 23.7 + f.u.uSeed.value * 3);
      f.u.uI.value = this.candleLevel > 0.2 ? 1 : 0.0;
      f.mesh.visible = this.candleLevel > 0.2;
      f.light.intensity = this.candleLevel * 0.55 * fl;
    }
  }
}
