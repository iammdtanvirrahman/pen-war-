import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PenModelType } from '../types/game';

interface PenPreview3DProps {
  model: PenModelType;
  color: string;
}

/** Small live Three.js preview using the same GLB/procedural pen styles as gameplay. */
export const PenPreview3D: React.FC<PenPreview3DProps> = ({ model, color }) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frame = 0;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080808');

    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.01, 20);
    camera.position.set(0.05, 0.62, 0.98);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.1));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = false;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe1e9ff, 0x493022, 2.0));
    const key = new THREE.DirectionalLight(0xffedda, 3.0);
    key.position.set(1.5, 3, 2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xa7c8ff, 1.1);
    fill.position.set(-2, 1, -2);
    scene.add(fill);

    const penGroup = new THREE.Group();
    scene.add(penGroup);
    const bodyColor = new THREE.Color(color);
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.32, metalness: 0.35 });
    const metalMat = new THREE.MeshStandardMaterial({ color: '#d1d5db', roughness: 0.2, metalness: 0.85 });
    const darkMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.45, metalness: 0.72 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.72, metalness: 0.05 });
    const brassMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.25, metalness: 0.85 });
    const addCylinder = (radiusTop: number, radiusBottom: number, length: number, mat: THREE.Material, x: number, sides = 24) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, length, sides), mat);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.x = x;
      penGroup.add(mesh);
      return mesh;
    };

    if (model === 'faber_castell') {
      new GLTFLoader().load('/assets/pens/models/faber-castell_pen.glb', (gltf) => {
        if (disposed) {
          gltf.scene.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
          });
          return;
        }
        const asset = gltf.scene;
        const box = new THREE.Box3().setFromObject(asset);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        asset.position.sub(center);
        const maxLength = Math.max(size.x, size.y, size.z);
        if (maxLength > 0) asset.scale.setScalar(0.76 / maxLength);
        asset.rotation.set(0, 0, 0);
        asset.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((m) => {
              const mat = m as THREE.MeshStandardMaterial;
              if ('roughness' in mat) mat.roughness = Math.max(0.32, mat.roughness ?? 0.5);
              if ('metalness' in mat) mat.metalness = Math.min(0.65, mat.metalness ?? 0.1);
            });
          }
        });
        // The in-game asset is aligned along its local X axis.
        penGroup.add(asset);
        renderer.render(scene, camera);
      }, undefined, () => {
        addCylinder(0.027, 0.027, 0.52, bodyMat, 0);
        addCylinder(0.028, 0.028, 0.14, rubberMat, 0.16);
        addCylinder(0.027, 0.007, 0.08, metalMat, 0.29);
        addCylinder(0.026, 0.028, 0.06, metalMat, -0.29);
        renderer.render(scene, camera);
      });
    } else if (model === 'fineliner') {
      addCylinder(0.027, 0.027, 0.52, bodyMat, 0);
      addCylinder(0.028, 0.028, 0.14, darkMat, 0.18);
      // Visible tapered writing nose, with a small dark collar and bright metal nib.
      const tipCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.027, 0.055, 20), darkMat);
      tipCollar.rotation.z = -Math.PI / 2;
      tipCollar.position.x = 0.285;
      penGroup.add(tipCollar);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.085, 20), metalMat);
      tip.rotation.z = -Math.PI / 2;
      tip.position.x = 0.35;
      penGroup.add(tip);
      const nib = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.035, 12), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.16, metalness: 0.95 }));
      nib.rotation.z = -Math.PI / 2;
      nib.position.x = 0.405;
      penGroup.add(nib);
      addCylinder(0.028, 0.026, 0.06, metalMat, -0.29);
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.008, 0.012), metalMat);
      clip.position.set(-0.22, 0.031, 0);
      clip.rotation.z = -0.06;
      penGroup.add(clip);
    } else if (model === 'tactical') {
      addCylinder(0.033, 0.033, 0.52, darkMat, 0, 6);
      [-0.12, 0, 0.12].forEach((x) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.004, 8, 24), brassMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = x;
        penGroup.add(ring);
      });
      // Distinct tapered metal point so the tactical pen's front is clearly visible.
      const tipBase = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.033, 0.045, 8), brassMat);
      tipBase.rotation.z = Math.PI / 2;
      tipBase.position.x = 0.282;
      penGroup.add(tipBase);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.12, 8), metalMat);
      tip.rotation.z = -Math.PI / 2;
      tip.position.x = 0.36;
      penGroup.add(tip);
      const nib = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.035, 8), brassMat);
      nib.rotation.z = -Math.PI / 2;
      nib.position.x = 0.437;
      penGroup.add(nib);
      addCylinder(0.034, 0.034, 0.08, brassMat, -0.3, 6);
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.009, 0.012), brassMat);
      clip.position.set(-0.22, 0.038, 0);
      clip.rotation.z = -0.06;
      penGroup.add(clip);
    } else {
      addCylinder(0.029, 0.031, 0.54, bodyMat, 0);
      addCylinder(0.032, 0.032, 0.16, rubberMat, 0.16);
      // Chrome nose and a narrow writing point, clearly separated from the barrel.
      const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.055, 20), metalMat);
      nose.rotation.z = -Math.PI / 2;
      nose.position.x = 0.29;
      penGroup.add(nose);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.09, 20), metalMat);
      tip.rotation.z = -Math.PI / 2;
      tip.position.x = 0.36;
      penGroup.add(tip);
      const nib = new THREE.Mesh(new THREE.ConeGeometry(0.005, 0.035, 12), metalMat);
      nib.rotation.z = -Math.PI / 2;
      nib.position.x = 0.422;
      penGroup.add(nib);
      addCylinder(0.033, 0.033, 0.14, metalMat, -0.3);
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.009, 0.012), metalMat);
      clip.position.set(-0.22, 0.037, 0);
      clip.rotation.z = -0.06;
      penGroup.add(clip);
    }

    // Match the game camera's readable three-quarter angle and keep every pen fully in frame.
    penGroup.rotation.set(0.16, 0.05, -0.03);
    const resize = () => {
      if (!host || disposed) return;
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!disposed) renderer.render(scene, camera);
    });
    resizeObserver.observe(host);

    // Static asset-style preview: render once, then only redraw when its size changes.
    // No idle animation or continuous animation-frame loop, keeping the armory lightweight.
    renderer.render(scene, camera);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
      penGroup.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
      });
      [bodyMat, metalMat, darkMat, rubberMat, brassMat].forEach((m) => m.dispose());
    };
  }, [model, color]);

  return <div ref={hostRef} className="w-full h-full overflow-hidden" aria-label={`3D preview of ${model}`} />;
};
