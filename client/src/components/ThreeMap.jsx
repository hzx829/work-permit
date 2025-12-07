import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, Grid, Text, Billboard, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';

// 科技感材质组件
const TechMaterial = ({ color, hovered }) => (
  <meshPhysicalMaterial
    color={hovered ? '#67e8f9' : color}
    emissive={hovered ? '#22d3ee' : '#000000'}
    emissiveIntensity={hovered ? 0.5 : 0}
    metalness={0.9}
    roughness={0.1}
    transparent
    opacity={0.8}
    transmission={0.2}
    clearcoat={1}
  />
);

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
        <TechMaterial color={color} hovered={hovered} />
        {/* 科技感边框 */}
        <lineSegments>
            <edgesGeometry args={[new THREE.CylinderGeometry(radius, radius, height, 32)]} />
            <lineBasicMaterial color={hovered ? '#a5f3fc' : '#38bdf8'} linewidth={1} transparent opacity={0.4} />
        </lineSegments>
      </mesh>
      {/* 罐顶 */}
      <mesh position={[0, height, 0]}>
         <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
         <TechMaterial color={color} hovered={hovered} />
         <lineSegments>
            <edgesGeometry args={[new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5)]} />
            <lineBasicMaterial color={hovered ? '#a5f3fc' : '#38bdf8'} linewidth={1} transparent opacity={0.3} />
        </lineSegments>
      </mesh>
      
      {hovered && (
        <Billboard position={[0, height + radius + 0.8, 0]}>
          <Text fontSize={0.4} color="#e0f2fe" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#0ea5e9">
            {label}
          </Text>
          <mesh position={[0, -0.3, 0]}>
             <planeGeometry args={[2, 0.05]} />
             <meshBasicMaterial color="#0ea5e9" />
          </mesh>
        </Billboard>
      )}
      
      {/* 地面辉光 */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + 0.3, 32]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.2} side={THREE.DoubleSide} />
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
        <TechMaterial color={color} hovered={hovered} />
        <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
            <lineBasicMaterial color={hovered ? '#a5f3fc' : '#38bdf8'} linewidth={1} transparent opacity={0.5} />
        </lineSegments>
      </mesh>
      {hovered && (
        <Billboard position={[0, size[1] + 0.8, 0]}>
          <Text fontSize={0.5} color="#e0f2fe" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#0ea5e9">
            {label}
          </Text>
          <mesh position={[0, -0.35, 0]}>
             <planeGeometry args={[2.5, 0.05]} />
             <meshBasicMaterial color="#0ea5e9" />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}

// 连续管道组件
function PipeLine({ points, color = "#94a3b8" }) {
    const curve = useMemo(() => {
        const vectors = points.map(p => new THREE.Vector3(...p));
        return new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.05); // 低张力，接近直线但拐角平滑
    }, [points]);

    return (
        <mesh>
            <tubeGeometry args={[curve, 64, 0.08, 8, false]} />
            <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
        </mesh>
    );
}

// 报警标记
function AlarmMarker({ position, label }) {
    const ringRef = useRef();
    const innerRef = useRef();
    
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (ringRef.current) {
            ringRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.3);
            ringRef.current.material.opacity = 0.5 - Math.sin(t * 4) * 0.3;
        }
        if (innerRef.current) {
            innerRef.current.position.y = Math.sin(t * 2) * 0.1;
        }
    });

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
                {/* 核心警告图标 */}
                <mesh ref={innerRef}>
                    <octahedronGeometry args={[0.3, 0]} />
                    <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} toneMapped={false} />
                </mesh>
                
                {/* 扩散波纹 */}
                <mesh ref={ringRef} rotation={[-Math.PI/2, 0, 0]}>
                    <ringGeometry args={[0.4, 0.5, 32]} />
                    <meshBasicMaterial color="#ef4444" transparent opacity={0.5} side={THREE.DoubleSide} />
                </mesh>

                {/* 标签 */}
                <Billboard position={[0, 0.8, 0]}>
                    <Text fontSize={0.3} color="#fca5a5" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#7f1d1d">
                        {label}
                    </Text>
                </Billboard>
            </Float>
            <pointLight color="#ef4444" distance={3} intensity={2} />
        </group>
    );
}

function Scene() {
  return (
    <>
      {/* 环境设置 */}
      <Environment preset="city" />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 20, 10]} intensity={1.5} color="#bae6fd" />
      <pointLight position={[-10, 10, -10]} intensity={1} color="#3b82f6" />
      
      <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={0.5} />
      <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#7dd3fc" />
      
      <Grid 
        renderOrder={-1} 
        position={[0, 0, 0]} 
        infiniteGrid 
        cellSize={1} 
        sectionSize={5} 
        fadeDistance={40} 
        sectionColor="#1e40af" 
        cellColor="#1e293b" 
      />

      {/* === 罐区 (Tank Farm) === */}
      <group position={[-4, 0, -2]}>
        <Tank position={[0, 0, 0]} radius={1} height={2} color="#334155" label="原料罐 A" />
        <Tank position={[2.5, 0, 0]} radius={1} height={2} color="#334155" label="原料罐 B" />
        <Tank position={[0, 0, 2.5]} radius={1} height={2} color="#334155" label="原料罐 C" />
        <Tank position={[2.5, 0, 2.5]} radius={1} height={2} color="#334155" label="原料罐 D" />
      </group>

      {/* === 核心工艺区 (Process Unit) === */}
      <group position={[3, 0, 0]}>
        {/* 主反应车间 */}
        <FactoryBuilding position={[0, 0, 0]} size={[4, 2, 3]} color="#1e3a8a" label="反应车间 #1" />
        
        {/* 精馏塔群 */}
        <Tank position={[2.5, 0, -1]} radius={0.4} height={5} color="#475569" label="T-101 精馏塔" />
        <Tank position={[3.5, 0, -1]} radius={0.3} height={4} color="#475569" label="T-102 吸收塔" />
        
        {/* 换热器/辅助设备 */}
        <FactoryBuilding position={[3, 0, 1]} size={[1.5, 1, 1]} color="#334155" label="换热机组" />
      </group>

      {/* === 仓库/中控 === */}
      <FactoryBuilding position={[-2, 0, 4]} size={[3, 1, 2]} color="#0f172a" label="成品仓库" />
      <FactoryBuilding position={[4, 0, 4]} size={[2, 1, 2]} color="#172554" label="中央控制室" />

      {/* === 管道系统 (优化路径避免穿模) === */}
      {/* 路径1: 原料罐B -> 反应车间 */}
      {/* 罐B中心在 [-1.5, 0, -2], 半径1. 出口在 [-0.5, 0.5, -2] */}
      {/* 车间中心在 [3, 0, 0], 尺寸[4,2,3]. 左侧面 x=1. 入口在 [1, 0.5, 0] */}
      <PipeLine points={[
          [-0.5, 0.5, -2], // 罐B出口
          [0, 0.5, -2],    // 稍微向右
          [0, 0.5, 0],     // 向前拐
          [1, 0.5, 0]      // 进入车间
      ]} color="#cbd5e1" />

      {/* 路径2: 反应车间 -> 精馏塔 */}
      {/* 车间右侧面 x=5. 出口 [5, 1.5, -1] */}
      {/* 塔T-101中心 [5.5, 0, -1]. 入口 [5.5, 3, -1] */}
      {/* 修正: 车间中心[3,0,0], x范围[1, 5]. 右侧面是 x=5. */}
      {/* 塔T-101在Group[3,0,0]内的[2.5,0,-1] -> 世界坐标 [5.5, 0, -1] */}
      {/* 塔半径0.4. 表面 x=5.1 */}
      <PipeLine points={[
          [5, 1.5, -1],    // 车间右侧出口
          [5.1, 1.5, -1],  // 连接到塔
          [5.1, 3, -1]     // 爬升
      ]} color="#94a3b8" />

      {/* 路径3: 塔间连接 */}
      <PipeLine points={[
          [5.5, 4, -1],    // T-101 顶部附近
          [6.5, 3.5, -1]   // T-102 顶部附近
      ]} color="#64748b" />

      {/* 危险源标记 */}
      <AlarmMarker position={[3, 2.5, 0]} label="温度异常" />
    </>
  );
}

export default function ThreeMap() {
  return (
    <div className="w-full h-full bg-slate-950">
      <Canvas>
        <PerspectiveCamera makeDefault position={[12, 10, 12]} fov={40} />
        <OrbitControls 
            enablePan={true} 
            minPolarAngle={Math.PI / 6} 
            maxPolarAngle={Math.PI / 2.2}
            autoRotate
            autoRotateSpeed={0.2}
            maxDistance={30}
        />
        <Scene />
        <fog attach="fog" args={['#020617', 10, 50]} />
      </Canvas>
    </div>
  );
}
