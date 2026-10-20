import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AlertCircle, Camera, Cpu, UploadCloud } from 'lucide-react';

type Props = {
  portraitUrl: string | null;
  modelUrl: string | null;
  audioLevel: React.MutableRefObject<number>;
  speaking: boolean;
  thinking: boolean;
  onUpload: (file: File) => void;
};
const MOUTH = ['jawOpen', 'JawOpen', 'mouthOpen', 'viseme_aa', 'viseme_AA', 'Fcl_MTH_A', 'A'];
const BLINK = ['eyeBlinkLeft', 'eyeBlinkRight', 'EyeBlinkLeft', 'EyeBlinkRight', 'Fcl_EYE_Close_L', 'Fcl_EYE_Close_R'];

function applyMorph(mesh: THREE.Mesh, names: string[], target: number) {
  if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
  for (const name of names) {
    const i = mesh.morphTargetDictionary[name];
    if (i !== undefined) {
      mesh.morphTargetInfluences[i] += (target - mesh.morphTargetInfluences[i]) * 0.3;
    }
  }
}

export default function AvatarStage({ portraitUrl, modelUrl, audioLevel, speaking, thinking, onUpload }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const mouth = useRef<HTMLDivElement>(null);
  const speakingRef = useRef(speaking);
  const thinkingRef = useRef(thinking);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  speakingRef.current = speaking;
  thinkingRef.current = thinking;

  useEffect(() => {
    if (!modelUrl || !holder.current) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    } catch {
      setError('WebGL is unavailable. Portrait mode still works.');
      return;
    }
    let cancelled = false;
    let raf = 0;
    const host = holder.current;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor(0, 0);
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .01, 100);
    camera.position.set(0, 0.16, 4.8);
    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x343044, 2.4));
    const key = new THREE.DirectionalLight(0xffdbcb, 3.5);
    key.position.set(3, 4, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xa484ff, 2.5);
    rim.position.set(-3, 2, -3);
    scene.add(rim);
    const meshes: THREE.Mesh[] = [];
    const headBones: THREE.Bone[] = [];
    const startQuats = new Map<THREE.Bone, THREE.Quaternion>();
    let avatar: THREE.Object3D | undefined;
    let blink = 0;
    let nextBlink = 3;
    let mouthOpenness = 0;
    let lastFrame = 0;
    const clock = new THREE.Clock();
    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    new GLTFLoader().load(modelUrl, gltf => {
      if (cancelled) return;
      avatar = gltf.scene;
      scene.add(avatar);
      avatar.traverse(node => {
        const mesh = node as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.frustumCulled = false;
          meshes.push(mesh);
        }
        const bone = node as THREE.Bone;
        if (bone.isBone && /^(head|neck)$/i.test(bone.name.replace(/[^a-z]/gi, ''))) {
          headBones.push(bone);
          startQuats.set(bone, bone.quaternion.clone());
        }
      });
      const bounds = new THREE.Box3().setFromObject(avatar);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      if (size.y > 0) {
        const s = 2.7 / size.y;
        avatar.scale.setScalar(s);
        avatar.position.sub(center.multiplyScalar(s));
      }
      setError('');
    }, undefined, () => {
      if (!cancelled) setError('Model load failed. Use a compatible GLB with facial blendshapes.');
    });

    const tick = () => {
      if (cancelled) return;
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      if (t - lastFrame < 1 / 30) return;
      lastFrame = t;
      mouthOpenness += ((speakingRef.current ? Math.min(1, audioLevel.current * 10) : 0) - mouthOpenness) * .38;
      if (t > nextBlink) {
        blink = 1;
        nextBlink = t + 3 + Math.random() * 2;
      }
      blink *= .65;
      meshes.forEach(mesh => {
        applyMorph(mesh, MOUTH, mouthOpenness * .9);
        applyMorph(mesh, BLINK, blink);
        applyMorph(mesh, ['mouthSmileLeft', 'mouthSmileRight'], thinkingRef.current ? .06 : .13);
      });
      headBones.forEach(bone => {
        const base = startQuats.get(bone);
        if (base) {
          const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(t * .45) * .018, Math.sin(t * .31) * .035, 0));
          bone.quaternion.copy(base).multiply(delta);
        }
      });
      if (avatar && !headBones.length) avatar.rotation.y = Math.sin(t * .3) * .03;
      renderer.render(scene, camera);
    };
    tick();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      if (avatar) {
        avatar.traverse(node => {
          const mesh = node as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach(material => { if (material) material.dispose(); });
          }
        });
      }
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [modelUrl, audioLevel]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const level = speakingRef.current ? Math.min(1, audioLevel.current * 11) : 0;
      if (photo.current) {
        photo.current.style.transform = 'scale(1.06) translate3d(' + Math.sin(t * .37) * 2.5 + 'px,' + Math.sin(t * .61) * 3 + 'px,0)';
      }
      if (mouth.current) {
        mouth.current.style.transform = 'translate(-50%,-50%) scaleY(' + (.6 + level * 3.2) + ')';
        mouth.current.style.opacity = String(.08 + level * .5);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [audioLevel]);

  const hasModel = Boolean(modelUrl && !error);
  return (
    <section className={'mei-stage' + (dragging ? ' is-dragging' : '')}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onUpload(f); }}>
      <div className="mei-stage-ambient" />
      {!hasModel && portraitUrl && <div className="mei-stage-photo" ref={photo} style={{ backgroundImage: 'url("' + portraitUrl + '")' }}>
        <div className="mei-mouth-shade" ref={mouth} />
      </div>}
      {!hasModel && !portraitUrl && <div className="mei-stage-empty">
        <div className="mei-stage-empty-icon"><Camera size={38}/></div>
        <h3>Your Mei, your look</h3>
        <p>Import the realistic Mei portrait from your previous project, or a facially rigged 3D model.</p>
      </div>}
      {hasModel && <div className="mei-stage-canvas" ref={holder} />}
      <div className="mei-stage-vignette" />
      <header className="mei-stage-status">
        <span className="mei-pill"><span className="mei-pulse" /> {speaking ? 'SPEAKING' : thinking ? 'THINKING' : 'PRESENT'}</span>
        <span className="mei-pill"><Cpu size={13}/> {hasModel ? '3D AVATAR' : 'PORTRAIT'}</span>
      </header>
      <footer className="mei-stage-footer">
        <div><span className="mei-overline">YOUR DIGITAL COMPANION</span><h2>Meet Mei<span>.</span></h2><p>More presence. Less processing.</p></div>
        <label className="mei-stage-import"><UploadCloud size={16}/> Import look <input type="file" hidden accept=".glb,.gltf,.jpg,.jpeg,.png,.webp" onChange={e => { const f=e.target.files?.[0]; if(f) onUpload(f); e.currentTarget.value=''; }}/></label>
      </footer>
      {error && <div className="mei-stage-error"><AlertCircle size={15}/>{error}</div>}
      {dragging && <div className="mei-drop-help">Drop an image or rigged GLB</div>}
    </section>
  );
}
