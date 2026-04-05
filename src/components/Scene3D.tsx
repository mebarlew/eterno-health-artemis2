"use client";

import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { MissionData } from "@/types/mission";

const SCALE = 1 / 8000;
const EARTH_RADIUS = 1.8;
const MOON_RADIUS = 0.7;
const ORION_SIZE = 0.35;

const COLORS = {
  brandPrimary: 0x88e59c,
  brandDark: 0x17332d,
  brandDarkAlt: 0x385759,
  earth: 0x4488cc,
  earthGlow: 0x3366aa,
  moon: 0xaaaaaa,
  orionGlow: 0x88e59c,
  trajectoryPast: 0x88e59c,
  trajectoryFuture: 0x385759,
  grid: 0x1a3a30,
  stars: 0xffffff,
  bg: 0x080f0d,
};

export default function Scene3D({ data }: { data: MissionData | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    orionMesh: THREE.Mesh;
    orionGlow: THREE.Mesh;
    moonMesh: THREE.Mesh;
    trajectoryLine: THREE.Line | null;
    moonOrbitLine: THREE.Line | null;
    animId: number;
  } | null>(null);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(COLORS.bg);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(COLORS.bg, 0.003);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 2000);
    camera.position.set(0, 35, 55);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controls.target.set(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(50, 30, 40);
    scene.add(sunLight);

    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      color: COLORS.earth,
      emissive: COLORS.earthGlow,
      emissiveIntensity: 0.15,
      shininess: 30,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    const earthGlowGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.15, 32, 32);
    const earthGlowMat = new THREE.MeshBasicMaterial({
      color: 0x4499dd,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(earthGlowGeo, earthGlowMat));

    const moonGeo = new THREE.SphereGeometry(MOON_RADIUS, 32, 32);
    const moonMat = new THREE.MeshPhongMaterial({
      color: COLORS.moon,
      emissive: 0x555555,
      emissiveIntensity: 0.05,
      shininess: 5,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moonMesh);

    const orionGeo = new THREE.SphereGeometry(ORION_SIZE, 16, 16);
    const orionMat = new THREE.MeshBasicMaterial({ color: COLORS.brandPrimary });
    const orionMesh = new THREE.Mesh(orionGeo, orionMat);
    scene.add(orionMesh);

    const orionGlowGeo = new THREE.SphereGeometry(ORION_SIZE * 3, 16, 16);
    const orionGlowMat = new THREE.MeshBasicMaterial({
      color: COLORS.orionGlow,
      transparent: true,
      opacity: 0.15,
    });
    const orionGlow = new THREE.Mesh(orionGlowGeo, orionGlowMat);
    scene.add(orionGlow);

    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(3000);
    for (let i = 0; i < 3000; i++) {
      starPositions[i] = (Math.random() - 0.5) * 800;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: COLORS.stars, size: 0.3, sizeAttenuation: true });
    scene.add(new THREE.Points(starsGeo, starsMat));

    const gridGeo = new THREE.RingGeometry(5, 80, 64);
    const gridMat = new THREE.MeshBasicMaterial({
      color: COLORS.grid,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -2;
    scene.add(grid);

    const state = {
      renderer,
      scene,
      camera,
      controls,
      orionMesh,
      orionGlow,
      moonMesh,
      trajectoryLine: null as THREE.Line | null,
      moonOrbitLine: null as THREE.Line | null,
      animId: 0,
    };

    function animate() {
      state.animId = requestAnimationFrame(animate);
      controls.update();

      const t = Date.now() * 0.001;
      orionGlowMat.opacity = 0.1 + Math.sin(t * 2) * 0.05;
      orionMesh.scale.setScalar(1 + Math.sin(t * 3) * 0.05);

      renderer.render(scene, camera);
    }
    animate();

    sceneRef.current = state;

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(state.animId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  useEffect(() => {
    if (!sceneRef.current || !data) return;
    const s = sceneRef.current;

    const ox = data.current.orion.x * SCALE;
    const oy = data.current.orion.z * SCALE;
    const oz = -data.current.orion.y * SCALE;
    s.orionMesh.position.set(ox, oy, oz);
    s.orionGlow.position.set(ox, oy, oz);

    const mx = data.current.moon.x * SCALE;
    const my = data.current.moon.z * SCALE;
    const mz = -data.current.moon.y * SCALE;
    s.moonMesh.position.set(mx, my, mz);

    if (s.trajectoryLine) {
      s.scene.remove(s.trajectoryLine);
      s.trajectoryLine.geometry.dispose();
    }
    const now = new Date();
    const trajPoints = data.trajectory.map((p) => new THREE.Vector3(p.x * SCALE, p.z * SCALE, -p.y * SCALE));
    if (trajPoints.length > 1) {
      const curve = new THREE.CatmullRomCurve3(trajPoints);
      const smoothPoints = curve.getPoints(200);

      const pastColor = new THREE.Color(COLORS.trajectoryPast);
      const futureColor = new THREE.Color(COLORS.trajectoryFuture);
      const colors = new Float32Array(smoothPoints.length * 3);
      const positions = new Float32Array(smoothPoints.length * 3);

      for (let i = 0; i < smoothPoints.length; i++) {
        positions[i * 3] = smoothPoints[i].x;
        positions[i * 3 + 1] = smoothPoints[i].y;
        positions[i * 3 + 2] = smoothPoints[i].z;

        const frac = i / smoothPoints.length;
        const trajTime = new Date(data.trajectory[0].timestamp).getTime() +
          frac * (new Date(data.trajectory[data.trajectory.length - 1].timestamp).getTime() -
            new Date(data.trajectory[0].timestamp).getTime());
        const isPast = trajTime <= now.getTime();
        const c = isPast ? pastColor : futureColor;
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 2 });
      s.trajectoryLine = new THREE.Line(geo, mat);
      s.scene.add(s.trajectoryLine);
    }

    if (s.moonOrbitLine) {
      s.scene.remove(s.moonOrbitLine);
      s.moonOrbitLine.geometry.dispose();
    }
    const moonPoints = data.moonOrbit.map((p) => new THREE.Vector3(p.x * SCALE, p.z * SCALE, -p.y * SCALE));
    if (moonPoints.length > 1) {
      const curve = new THREE.CatmullRomCurve3(moonPoints);
      const smooth = curve.getPoints(100);
      const geo = new THREE.BufferGeometry().setFromPoints(smooth);
      const mat = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 });
      s.moonOrbitLine = new THREE.Line(geo, mat);
      s.scene.add(s.moonOrbitLine);
    }
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] rounded-xl overflow-hidden" />
  );
}
