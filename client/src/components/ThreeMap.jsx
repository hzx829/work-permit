import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, Grid, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

// 储罐组件
function Tank({ position, radius, height, color, label }) {
  const [hovered, setHover] = useState(false);

  return (
    <group position={position}>
      <mesh 
        position={[0, height/2, 0]}
        onPointerOver={() => setHover(true)} 
        onPointerOut={() => setHover(false)}
      >
        <cylinderGeometry args={[radius, radius, height, 32]} />
        <meshStandardMaterial 
            color={hovered ? '#22d3ee' : color} 
            metalness={0.6} 
            roughness={0.2} 
            transparent 
            opacity={0.9}
        />
        <lineSegments>
            <edgesGeometry args={[new THREE.CylinderGeometry(radius, radius, height, 32)]} />
            <lineBasicMaterial color={hovered ? '#67e8f9' : '#1e40af'} linewidth={1} />
        </lineSegments>
      </mesh>
      {/* 罐顶 */}
      <mesh position={[0, height, 0]}>
         <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
         <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
      </mesh>
      
      {hovered && (
        <Billboard position={[0, height + radius + 0.5, 0]}>
          <Text fontSize={0.4} color="white" anchorX="center" anchorY="middle">
            {label}
          </Text>
        </Billboard>
      )}
      
      {/* 地面投影 */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + 0.2, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// 厂房/建筑组件
function FactoryBuilding({ position, size, color, label }) {
  const [hovered, setHover] = useState(false);

  return (
    <group position={position}>
      <mesh 
        position={[0, size[1]/2, 0]}
        onPointerOver={() => setHover(true)} 
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial 
            color={hovered ? '#22d3ee' : color} 
            metalness={0.5} 
            roughness={0.1} 
            transparent 
            opacity={0.8}
        />
        <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
            <lineBasicMaterial color={hovered ? '#67e8f9' : '#1e40af'} linewidth={1} />
        </lineSegments>
      </mesh>
      {hovered && (
        <Billboard position={[0, size[1] + 0.5, 0]}>
          <Text fontSize={0.4} color="white" anchorX="center" anchorY="middle">
            {label}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

// 管道组件
function Pipe({ start, end, color = "#64748b" }) {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const distance = startVec.distanceTo(endVec);
    const position = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
    
    // 计算旋转
    const direction = new THREE.Vector3().subVectors(endVec, startVec).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

    return (
        <mesh position={position} quaternion={quaternion}>
            <cylinderGeometry args={[0.1, 0.1, distance, 8]} />
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
    );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 20, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#3b82f6" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Grid 
        renderOrder={-1} 
        position={[0, 0, 0]} 
        infiniteGrid 
        cellSize={1} 
        sectionSize={3} 
        fadeDistance={30} 
        sectionColor="#1e40af" 
        cellColor="#0f172a" 
      />

      {/* === 罐区 (Tank Farm) === */}
      <group position={[-4, 0, -2]}>
        <Tank position={[0, 0, 0]} radius={1} height={2} color="#475569" label="原料罐 A" />
        <Tank position={[2.5, 0, 0]} radius={1} height={2} color="#475569" label="原料罐 B" />
        <Tank position={[0, 0, 2.5]} radius={1} height={2} color="#475569" label="原料罐 C" />
        <Tank position={[2.5, 0, 2.5]} radius={1} height={2} color="#475569" label="原料罐 D" />
      </group>

      {/* === 核心工艺区 (Process Unit) === */}
      <group position={[3, 0, 0]}>
        {/* 主反应车间 */}
        <FactoryBuilding position={[0, 0, 0]} size={[4, 2, 3]} color="#1e3a8a" label="反应车间 #1" />
        
        {/* 精馏塔群 */}
        <Tank position={[2.5, 0, -1]} radius={0.4} height={5} color="#64748b" label="T-101 精馏塔" />
        <Tank position={[3.5, 0, -1]} radius={0.3} height={4} color="#64748b" label="T-102 吸收塔" />
        
        {/* 换热器/辅助设备 */}
        <FactoryBuilding position={[3, 0, 1]} size={[1.5, 1, 1]} color="#334155" label="换热机组" />
      </group>

      {/* === 仓库/中控 === */}
      <FactoryBuilding position={[-2, 0, 4]} size={[3, 1, 2]} color="#0f172a" label="成品仓库" />
      <FactoryBuilding position={[4, 0, 4]} size={[2, 1, 2]} color="#1e40af" label="中央控制室" />

      {/* === 管道连接示意 === */}
      {/* 罐区到车间 */}
      <Pipe start={[-1.5, 0.5, -2]} end={[1, 0.5, -2]} />
      <Pipe start={[1, 0.5, -2]} end={[1, 0.5, 0]} />
      
      {/* 车间到塔 */}
      <Pipe start={[3, 1.5, 0]} end={[3, 1.5, -1]} />
      <Pipe start={[3, 1.5, -1]} end={[5.5, 3, -1]} />

      {/* 危险源标记 (模拟报警) */}
      <mesh position={[3, 3, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshBasicMaterial color="#ef4444" />
        <pointLight distance={3} intensity={2} color="#ef4444" />
      </mesh>
    </>
  );
}

export default function ThreeMap() {
  return (
    <div className="w-full h-full bg-slate-900">
      <Canvas>
        <PerspectiveCamera makeDefault position={[10, 8, 10]} fov={45} />
        <OrbitControls 
            enablePan={true} 
            minPolarAngle={Math.PI / 6} 
            maxPolarAngle={Math.PI / 2.2}
            autoRotate
            autoRotateSpeed={0.5}
        />
        <Scene />
        <fog attach="fog" args={['#020617', 5, 40]} />
      </Canvas>
    </div>
  );
}
