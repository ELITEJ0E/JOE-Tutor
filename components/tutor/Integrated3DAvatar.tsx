import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';

type Props = {
  levelRef: React.MutableRefObject<number>;
  talking: boolean;
  enabled: boolean;
  onReady?: (detail: string) => void;
  lowPower: boolean;
  rotate: boolean;
};

const SAMPLE_URL = '/models/mei-mpfb-cc0.glb';
// Self-hosted optimized CC0 MPFB human avatar, sourced from met4citizen/TalkingHead.
// Frames and facial blendshapes are rendered on the visitor's device.

function makePreviewAvatar(): { root: THREE.Group; jaw: THREE.Object3D; eyes: THREE.Object3D[] } {
  const root = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xe6af9f, roughness: 0.68, metalness: 0.0 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x211821, roughness: 0.72 });
  const iris = new THREE.MeshStandardMaterial({ color: 0x44312b, roughness: 0.32 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf7e8e5, roughness: 0.4 });
  const lip = new THREE.MeshStandardMaterial({ color: 0xb86774, roughness: 0.57 });
  const blouse = new THREE.MeshStandardMaterial({ color: 0x3e283f, roughness: 0.89 });
  const sphere = (material: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const object = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), material);
    object.position.set(x, y, z);
    object.scale.set(sx, sy, sz);
    root.add(object);
    return object;
  };
  sphere(blouse, 0, -1.13, 0, 0.73, 0.55, 0.40);
  sphere(skin, 0, -0.78, 0.08, 0.17, 0.33, 0.17);
  sphere(hair, 0, .20, -.16, .54, .78, .41);
  sphere(skin, 0, .25, .11, .43, .57, .38);
  sphere(hair, 0, .72, .0, .45, .24, .43);
  sphere(hair, -.46, -.13, -.05, .16, .62, .31);
  sphere(hair, .46, -.13, -.05, .16, .62, .31);
  sphere(skin, 0, .13, .48, .10, .16, .15);
  const eyes: THREE.Object3D[] = [];
  [-.185, .185].forEach(x => {
    const eye = sphere(white, x, .33, .432, .12, .07, .045);
    eyes.push(eye);
    sphere(iris, x, .32, .474, .047, .047, .018);
    sphere(hair, x, .47, .446, .155, .019, .026);
  });
  sphere(lip, 0, -.055, .476, .205, .044, .031);
  const jaw = sphere(lip, 0, -.105, .486, .12, .012, .012);
  return { root, jaw, eyes };
}

function setMorph(mesh: THREE.Mesh, names: string[], target: number) {
  const dict = mesh.morphTargetDictionary;
  const weights = mesh.morphTargetInfluences;
  if (!dict || !weights) return;
  for (const name of names) {
    // Some exported rigs prefix blendshape names with "blendShape1."
    const keys = [name, 'blendShape1.' + name, 'Fcl_MTH_' + name];
    for (const k of keys) {
      const index = dict[k];
      if (index !== undefined) weights[index] += (target - weights[index]) * .33;
    }
  }
}

export default function Integrated3DAvatar({ levelRef, talking, enabled, onReady, lowPower, rotate }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const talkingRef = useRef(talking);
  const enabledRef = useRef(enabled);
  const rotateRef = useRef(rotate);
  const onReadyRef = useRef(onReady);
  talkingRef.current = talking;
  enabledRef.current = enabled;
  rotateRef.current = rotate;
  onReadyRef.current = onReady;
  const [message, setMessage] = useState('Loading free 3D human model…');
  const modelUrl = SAMPLE_URL;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    } catch {
      setMessage('WebGL is unavailable in this browser.');
      return;
    }
    let disposed = false;
    let frame = 0;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
    camera.position.set(0, .02, 3.6);
    camera.lookAt(0, 0, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 0.75 : 1));
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x100d17, 0);
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xfff1ed, 0x31243d, 2.35));
    const key = new THREE.DirectionalLight(0xffdbc5, 3.7);
    key.position.set(2.4, 2.4, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xbca0ff, 2.2);
    rim.position.set(-3, 3, -2.5);
    scene.add(rim);
    const preview = makePreviewAvatar();
    scene.add(preview.root);

    let loadedModel: THREE.Object3D | null = null;
    let morphMeshes: THREE.Mesh[] = [];
    let headBone: THREE.Bone | null = null;
    let neutralHead: THREE.Quaternion | null = null;
    let openness = 0;
    let blink = 0;
    let nextBlink = 2.5;
    let previous = 0;
    const timer = new THREE.Clock();

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      camera.aspect = bounds.width / bounds.height;
      camera.updateProjectionMatrix();
      renderer.setSize(bounds.width, bounds.height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(modelUrl, gltf => {
      if (disposed) return;
      const obj = gltf.scene;
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      if (size.y > 0.01) {
        const multiplier = 2.9 / size.y;
        obj.scale.setScalar(multiplier);
        obj.position.set(-center.x * multiplier, -center.y * multiplier - .25, -center.z * multiplier);
      }
      obj.traverse(node => {
        const mesh = node as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.frustumCulled = false;
          morphMeshes.push(mesh);
        }
        const bone = node as THREE.Bone;
        if (bone.isBone && /head/i.test(bone.name) && !headBone) {
          headBone = bone;
          neutralHead = bone.quaternion.clone();
        }
      });
      loadedModel = obj;
      scene.add(obj);
      scene.remove(preview.root);
      setMessage('Live 3D avatar active');
      onReadyRef.current?.('Ready');
    }, event => {
      if (!disposed && event.total > 0) setMessage('Downloading 3D avatar ' + Math.round(event.loaded / event.total * 100) + '%');
    }, () => {
      if (!disposed) {
        setMessage('3D preview mode — model download unavailable');
        onReadyRef.current?.('Preview mode');
      }
    });

    const render = () => {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      if (document.hidden || !enabledRef.current) return;
      const t = timer.getElapsedTime();
      if (t - previous < 1 / (lowPower ? 24 : 30)) return;
      previous = t;
      const amplitude = talkingRef.current ? Math.min(1, levelRef.current * 11) : 0;
      openness += (amplitude - openness) * 0.3;
      if (t > nextBlink) {
        blink = 1;
        nextBlink = t + 2.3 + Math.random() * 2.5;
      }
      blink *= .72;
      morphMeshes.forEach(mesh => {
        setMorph(mesh, ['jawOpen', 'mouthOpen', 'viseme_aa', 'viseme_AA'], openness * .82);
        setMorph(mesh, ['mouthFunnel', 'mouthPucker', 'viseme_O'], openness * .15);
        setMorph(mesh, ['eyeBlinkLeft', 'eyeBlinkRight', 'eyesClosed'], blink);
        setMorph(mesh, ['mouthSmileLeft', 'mouthSmileRight'], 0.10);
      });
      preview.jaw.scale.y = 1 + openness * 18;
      preview.eyes.forEach(e => { e.scale.y = Math.max(.06, 1 - blink * .9) * .07; });
      if (loadedModel) {
        loadedModel.rotation.y = (rotateRef.current ? Math.sin(t * .32) * 0.16 : 0) + Math.sin(t * .19) * 0.012;
      } else {
        preview.root.rotation.y = rotateRef.current ? Math.sin(t * .36) * .16 : Math.sin(t * .21) * .02;
        preview.root.position.y = Math.sin(t * 1.4) * .015;
      }
      if (headBone && neutralHead) {
        const bone = headBone as THREE.Bone;
        const original = neutralHead as THREE.Quaternion;
        bone.quaternion.copy(original).multiply(
          new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(t * .51) * .021, Math.sin(t * .38) * .030, 0))
        );
      }
      renderer.render(scene, camera);
    };
    render();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
      // Scene disposal is limited to resources owned by this component.
      scene.traverse(n => {
        const mesh = n as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach(material => {
            if (!material) return;
            for (const value of Object.values(material)) {
              if (value instanceof THREE.Texture) value.dispose();
            }
            material.dispose();
          });
        }
      });
    };
  }, [modelUrl, lowPower, levelRef]);

  return <div className="joe-3d-render">
    <div className="joe-3d-canvas" ref={hostRef}/>
    <div className="joe-3d-status">{message}</div>
  </div>;
}
