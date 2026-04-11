import { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import * as THREE from 'three';

interface VRMAvatarProps {
  url: string;
  audioVolume?: number;
  currentEmotion?: string;
  mouseTarget?: { x: number, y: number };
}

export default function VRMAvatar({ url, audioVolume = 0, currentEmotion = 'neutral', mouseTarget = {x: 0, y:0} }: VRMAvatarProps) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  
  // Create an invisible 3D object to act as the "pointer" the Avatar will stare at
  const lookAtTarget = useRef<THREE.Object3D>(new THREE.Object3D());

  useEffect(() => {
    if (!url) return;

    let currentVrm: VRM | null = null;
    const loader = new GLTFLoader();

    // Register VRMLoaderPlugin
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      url,
      (gltf) => {
        const vrmData = gltf.userData.vrm as VRM;
        if (vrmData) {
          // Disable frustum culling for all meshes
          VRMUtils.removeUnnecessaryJoints(gltf.scene);
          VRMUtils.removeUnnecessaryVertices(gltf.scene);
          
          vrmData.scene.traverse((obj) => {
            obj.frustumCulled = false;
          });

          // Make the VRM face the camera
          vrmData.scene.rotation.y = Math.PI;
          
          // Connect our dummy Object3D into the VRM kinematics system
          if (vrmData.lookAt) {
             vrmData.lookAt.target = lookAtTarget.current;
          }
          
          setVrm(vrmData);
          currentVrm = vrmData;
          console.log('VRM loaded successfully');
        }
      },
      (progress) => {
         console.log(`Loading... ${(progress.loaded / progress.total) * 100}%`);
      },
      (error) => {
        console.error('An error occurred during VRM loading:', error);
      }
    );

    return () => {
      if (currentVrm) {
         currentVrm.scene.traverse((obj: any) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
               if (Array.isArray(obj.material)) {
                  obj.material.forEach((m: any) => m.dispose());
               } else {
                  obj.material.dispose();
               }
            }
         });
      }
    };
  }, [url]);

  // Update VRM animation every frame
  useFrame((state, delta) => {
    if (vrm) {
      // Basic Idle Animation: very slight breathing effect
      const s = Math.sin(state.clock.elapsedTime * 2);
      vrm.scene.position.y = s * 0.01;
      
      // Face Expression & Lip Sync
      if (vrm.expressionManager) {
         // Reset base emotions
         vrm.expressionManager.setValue('happy', 0);
         vrm.expressionManager.setValue('sad', 0);
         vrm.expressionManager.setValue('angry', 0);
         vrm.expressionManager.setValue('neutral', 0);
         
         if (currentEmotion === 'happy') {
            vrm.expressionManager.setValue('happy', 1.0);
         } else if (currentEmotion === 'sad') {
            vrm.expressionManager.setValue('sad', 1.0);
         } else if (currentEmotion === 'angry') {
            vrm.expressionManager.setValue('angry', 1.0);
         } else {
            vrm.expressionManager.setValue('neutral', 1.0);
         }
         
         // Animate the mouth ('aa') based on audio frequencies.
         // Multiplier enhances visual responsiveness to generic speech
         const mouthShape = Math.min(1.0, audioVolume * 2.2);
         vrm.expressionManager.setValue('aa', mouthShape);
      }
      
      // Smooth LookAt Iteration (neck and eyes track global OS mouse)
      if (lookAtTarget.current) {
          // Calculate target vector (scaled mapping of the OS screen to a 3D box floating in front of avatar)
          const targetX = mouseTarget.x * 2.0; 
          const targetY = mouseTarget.y * 1.5;
          const targetVec = new THREE.Vector3(targetX, targetY + 1.2, 2.0); // Z=2.0 pushes it out in front of face
          
          // Interpolate softly so it is realistic and human-like trailing
          lookAtTarget.current.position.lerp(targetVec, 0.08);
      }
      
      vrm.update(delta);
    }
  });

  if (!vrm) return null;

  return <primitive object={vrm.scene} />;
}
