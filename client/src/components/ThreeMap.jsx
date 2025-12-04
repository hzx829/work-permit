import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, Grid } from '@react-three/drei';
import * as THREE from 'three';

function Building({ position, size, color }) {
  const mesh = useRef();
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.position.y = position[1] + Math.sin(t + position[0]) * 0.1;
  });

  return (
    <group position={position}>
      {/* Main Block */}
      <mesh ref={mesh} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <boxGeometry args={size} />
        <meshStandardMaterial 
            color={hovered ? '#4f46e5' : color} 
            metalness={0.8} 
            roughness={0.2} 
            transparent 
            opacity={0.8} 
        />
        <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
            <lineBasicMaterial color={hovered ? '#818cf8' : '#3b82f6'} linewidth={2} />
        </lineSegments>
      </mesh>
      
      {/* Floor Glow */}
      <mesh position={[0, -size[1]/2 - 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, size[0], 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ec4899" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Grid 
        renderOrder={-1} 
        position={[0, -0.5, 0]} 
        infiniteGrid 
        cellSize={1} 
        sectionSize={3} 
        fadeDistance={30} 
        sectionColor="#1e40af" 
        cellColor="#172554" 
      />

      {/* Central Factory Complex */}
      <Building position={[0, 1, 0]} size={[2, 3, 2]} color="#1e3a8a" />
      <Building position={[-2, 0.5, 1]} size={[1.5, 2, 1.5]} color="#1e40af" />
      <Building position={[2, 0.5, -1]} size={[1.5, 2.5, 1.5]} color="#1d4ed8" />
      <Building position={[0, 0.5, 2.5]} size={[3, 1, 1]} color="#2563eb" />
      
      {/* Surrounding Facilities */}
      <Building position={[-4, 0.25, -3]} size={[1, 1.5, 1]} color="#3b82f6" />
      <Building position={[4, 0.25, 3]} size={[1, 1.5, 1]} color="#3b82f6" />
      <Building position={[-3, 0.25, 4]} size={[1, 1, 1]} color="#60a5fa" />
      <Building position={[3, 0.25, -4]} size={[1, 1, 1]} color="#60a5fa" />

      {/* Floating Data Points */}
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </>
  );
}

export default function ThreeMap() {
  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={45} />
        <OrbitControls 
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 2.2}
            autoRotate
            autoRotateSpeed={0.5}
        />
        <Scene />
        <fog attach="fog" args={['#050b14', 5, 30]} />
      </Canvas>
    </div>
  );
}
