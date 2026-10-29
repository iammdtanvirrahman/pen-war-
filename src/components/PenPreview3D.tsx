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
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.01, 20);
    camera.position.set(0.05, 1.55, 2.05);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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
      }, undefined, () => {
        addCylinder(0.027, 0.027, 0.52, bodyMat, 0);
        addCylinder(0.028, 0.028, 0.14, rubberMat, 0.16);
        addCylinder(0.027, 0.007, 0.08, metalMat, 0.29);
        addCylinder(0.026, 0.028, 0.06, metalMat, -0.29);
      });
    } else if (model === 'fineliner') {
      addCylinder(0.027, 0.027, 0.52, bodyMat, 0);
      addCylinder(0.028, 0.028, 0.14, darkMat, 0.18);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.027, 0.08, 20), metalMat);
      tip.rotation.z = -Math.PI / 2;
      tip.position.x = 0.29;
      penGroup.add(tip);
      addCylinder(0.028, 0.026, 0.06, metalMat, -0.29);
    } else if (model === 'tactical') {
      addCylinder(0.033, 0.033, 0.52, darkMat, 0, 6);
      [-0.12, 0, 0.12].forEach((x) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.004, 8, 24), brassMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = x;
        penGroup.add(ring);
      });
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.033, 0.11, 8), darkMat);
      tip.rotation.z = -Math.PI / 2;
      tip.position.x = 0.31;
      penGroup.add(tip);
      addCylinder(0.034, 0.034, 0.08, brassMat, -0.3, 6);
    } else {
      addCylinder(0.029, 0.031, 0.54, bodyMat, 0);
      addCylinder(0.032, 0.032, 0.16, rubberMat, 0.16);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 20), metalMat);
      tip.rotation.z = -Math.PI / 2;
      tip.position.x = 0.31;
      penGroup.add(tip);
      addCylinder(0.033, 0.033, 0.14, metalMat, -0.3);
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
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      penGroup.rotation.y = 0.05 + Math.sin(performance.now() * 0.00045) * 0.035;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
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
