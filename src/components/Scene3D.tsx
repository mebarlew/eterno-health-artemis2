"use client";

import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { MissionData } from "@/types/mission";

const SCALE = 1 / 8000;
const EARTH_RADIUS = 2.5;
const MOON_RADIUS = 1.0;
const ORION_SIZE = 0.4;

function createToonGradient(colors: number[]): THREE.DataTexture {
  const size = colors.length;
  const data = new Uint8Array(size * 4);
  colors.forEach((c, i) => {
    data[i * 4] = (c >> 16) & 0xff;
    data[i * 4 + 1] = (c >> 8) & 0xff;
    data[i * 4 + 2] = c & 0xff;
    data[i * 4 + 3] = 255;
  });
  const tex = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

function createOutline(geo: THREE.SphereGeometry, color: number, scale: number): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.setScalar(scale);
  return mesh;
}

export default function Scene3D({ data }: { data: MissionData | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    orionGroup: THREE.Group;
    moonGroup: THREE.Group;
    earthGroup: THREE.Group;
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
    renderer.setClearColor(0x0a1420);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 2000);
    camera.position.set(0, 40, 60);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 15;
    controls.maxDistance = 200;
    controls.target.set(0, 0, 0);

    // Lights — bright and flat for toon look
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(30, 30, 20);
    scene.add(sunLight);

    // === EARTH (cartoon) ===
    const earthGroup = new THREE.Group();
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 32, 32);
    const earthGrad = createToonGradient([0x1a5276, 0x2e86c1, 0x5dade2, 0x85c1e9]);
    const earthMat = new THREE.MeshToonMaterial({
      color: 0x3498db,
      gradientMap: earthGrad,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Earth outline
    const earthOutline = createOutline(earthGeo, 0x1a3550, 1.06);
    earthGroup.add(earthOutline);

    // Cartoon atmosphere ring
    const atmosphereGeo = new THREE.RingGeometry(EARTH_RADIUS * 1.02, EARTH_RADIUS * 1.18, 64);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x5dade2,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    atmosphere.lookAt(camera.position);
    earthGroup.add(atmosphere);

    // Cute face on Earth — eyes (two small white spheres with dark pupils)
    const eyeWhiteGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });

    const leftEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEye.position.set(-0.55, 0.5, EARTH_RADIUS * 0.92);
    earthGroup.add(leftEye);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.55, 0.45, EARTH_RADIUS * 0.92 + 0.22);
    earthGroup.add(leftPupil);

    const rightEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEye.position.set(0.55, 0.5, EARTH_RADIUS * 0.92);
    earthGroup.add(rightEye);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.55, 0.45, EARTH_RADIUS * 0.92 + 0.22);
    earthGroup.add(rightPupil);

    // Smile
    const smileCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.5, -0.2, EARTH_RADIUS * 0.95),
      new THREE.Vector3(0, -0.6, EARTH_RADIUS * 0.98),
      new THREE.Vector3(0.5, -0.2, EARTH_RADIUS * 0.95),
    );
    const smileGeo = new THREE.TubeGeometry(smileCurve, 20, 0.06, 8, false);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });
    earthGroup.add(new THREE.Mesh(smileGeo, smileMat));

    scene.add(earthGroup);

    // === MOON (cartoon) ===
    const moonGroup = new THREE.Group();
    const moonGeo = new THREE.SphereGeometry(MOON_RADIUS, 32, 32);
    const moonGrad = createToonGradient([0x7f8c8d, 0xbdc3c7, 0xecf0f1]);
    const moonMat = new THREE.MeshToonMaterial({
      color: 0xd5d8dc,
      gradientMap: moonGrad,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonGroup.add(moonMesh);

    // Moon outline
    const moonOutline = createOutline(moonGeo, 0x5d6d7e, 1.08);
    moonGroup.add(moonOutline);

    // Moon craters (small darker circles)
    const craterGeo = new THREE.SphereGeometry(0.15, 12, 12);
    const craterMat = new THREE.MeshToonMaterial({ color: 0x95a5a6, gradientMap: moonGrad });
    const craterPositions = [
      [0.3, 0.4, MOON_RADIUS * 0.85],
      [-0.2, -0.1, MOON_RADIUS * 0.9],
      [0.1, -0.35, MOON_RADIUS * 0.88],
    ];
    craterPositions.forEach(([cx, cy, cz]) => {
      const crater = new THREE.Mesh(craterGeo, craterMat);
      crater.position.set(cx, cy, cz);
      crater.scale.set(1, 1, 0.3);
      moonGroup.add(crater);
    });

    scene.add(moonGroup);

    // === ORION (cartoon spacecraft) ===
    const orionGroup = new THREE.Group();

    // Capsule body
    const capsuleGeo = new THREE.ConeGeometry(ORION_SIZE, ORION_SIZE * 2.2, 8);
    const capsuleMat = new THREE.MeshToonMaterial({
      color: 0x88e59c,
      gradientMap: createToonGradient([0x2ecc71, 0x58d68d, 0x88e59c, 0xabebc6]),
    });
    const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
    orionGroup.add(capsule);

    // Capsule outline
    const capsuleOutline = createOutline(
      capsuleGeo as unknown as THREE.SphereGeometry,
      0x1a5032,
      1.12,
    );
    orionGroup.add(capsuleOutline);

    // Glow ring
    const glowRingGeo = new THREE.RingGeometry(ORION_SIZE * 1.5, ORION_SIZE * 2.5, 32);
    const glowRingMat = new THREE.MeshBasicMaterial({
      color: 0x88e59c,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
    orionGroup.add(glowRing);

    // Thruster glow
    const thrusterGeo = new THREE.ConeGeometry(ORION_SIZE * 0.4, ORION_SIZE * 1.2, 6);
    const thrusterMat = new THREE.MeshBasicMaterial({
      color: 0xf39c12,
      transparent: true,
      opacity: 0.7,
    });
    const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    thruster.position.y = -ORION_SIZE * 1.6;
    thruster.rotation.x = Math.PI;
    orionGroup.add(thruster);

    scene.add(orionGroup);

    // === STARS (cartoon — bigger, twinkle) ===
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 400;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 600;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 600;
      starSizes[i] = Math.random() * 2 + 0.5;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starsGeo.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));
    const starsMat = new THREE.PointsMaterial({
      color: 0xffeaa7,
      size: 1.2,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(starsGeo, starsMat));

    // A few "big" decorative stars
    const bigStarGeo = new THREE.OctahedronGeometry(0.6, 0);
    const bigStarMat = new THREE.MeshBasicMaterial({ color: 0xffeaa7 });
    const bigStarPositions = [
      [40, 30, -50],
      [-50, 20, -30],
      [30, -25, -60],
      [-35, 35, 40],
      [55, -10, 20],
    ];
    bigStarPositions.forEach(([bx, by, bz]) => {
      const star = new THREE.Mesh(bigStarGeo, bigStarMat);
      star.position.set(bx, by, bz);
      scene.add(star);
    });

    const state = {
      renderer,
      scene,
      camera,
      controls,
      orionGroup,
      moonGroup,
      earthGroup,
      trajectoryLine: null as THREE.Line | null,
      moonOrbitLine: null as THREE.Line | null,
      animId: 0,
    };

    function animate() {
      state.animId = requestAnimationFrame(animate);
      controls.update();

      const t = Date.now() * 0.001;

      // Bobbing Earth
      earthGroup.rotation.y = t * 0.1;
      earthGroup.position.y = Math.sin(t * 0.5) * 0.3;

      // Atmosphere always faces camera
      atmosphere.lookAt(camera.position);

      // Orion wobble + thruster flicker
      orionGroup.rotation.z = Math.sin(t * 1.5) * 0.1;
      glowRing.rotation.z = t * 0.5;
      glowRingMat.opacity = 0.1 + Math.sin(t * 3) * 0.08;
      thrusterMat.opacity = 0.5 + Math.sin(t * 8) * 0.3;
      thruster.scale.y = 0.8 + Math.sin(t * 6) * 0.3;

      // Moon gentle bob
      moonGroup.position.y += Math.sin(t * 0.7 + 2) * 0.002;

      // Twinkle big stars
      scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.OctahedronGeometry) {
          child.rotation.y = t * 2;
          child.rotation.x = t * 1.5;
          child.scale.setScalar(0.8 + Math.sin(t * 3 + child.position.x) * 0.3);
        }
      });

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

    // Position Orion
    const ox = data.current.orion.x * SCALE;
    const oy = data.current.orion.z * SCALE;
    const oz = -data.current.orion.y * SCALE;
    s.orionGroup.position.set(ox, oy, oz);

    // Point capsule along velocity vector
    const vel = new THREE.Vector3(
      data.current.orion.vx,
      data.current.orion.vz,
      -data.current.orion.vy,
    ).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, vel);
    s.orionGroup.quaternion.copy(quat);

    // Position Moon
    const mx = data.current.moon.x * SCALE;
    const my = data.current.moon.z * SCALE;
    const mz = -data.current.moon.y * SCALE;
    s.moonGroup.position.set(mx, my, mz);

    // Trajectory line — dashed cartoon style
    if (s.trajectoryLine) {
      s.scene.remove(s.trajectoryLine);
      s.trajectoryLine.geometry.dispose();
    }
    const now = new Date();
    const trajPoints = data.trajectory.map(
      (p) => new THREE.Vector3(p.x * SCALE, p.z * SCALE, -p.y * SCALE),
    );
    if (trajPoints.length > 1) {
      const curve = new THREE.CatmullRomCurve3(trajPoints);
      const smoothPoints = curve.getPoints(200);

      const positions = new Float32Array(smoothPoints.length * 3);
      const colors = new Float32Array(smoothPoints.length * 3);

      const pastColor = new THREE.Color(0x88e59c);
      const futureColor = new THREE.Color(0x2d6a4f);

      const t0 = new Date(data.trajectory[0].timestamp).getTime();
      const t1 = new Date(data.trajectory[data.trajectory.length - 1].timestamp).getTime();

      for (let i = 0; i < smoothPoints.length; i++) {
        positions[i * 3] = smoothPoints[i].x;
        positions[i * 3 + 1] = smoothPoints[i].y;
        positions[i * 3 + 2] = smoothPoints[i].z;

        const frac = i / smoothPoints.length;
        const trajTime = t0 + frac * (t1 - t0);
        const c = trajTime <= now.getTime() ? pastColor : futureColor;
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

    // Moon orbit path
    if (s.moonOrbitLine) {
      s.scene.remove(s.moonOrbitLine);
      s.moonOrbitLine.geometry.dispose();
    }
    const moonPoints = data.moonOrbit.map(
      (p) => new THREE.Vector3(p.x * SCALE, p.z * SCALE, -p.y * SCALE),
    );
    if (moonPoints.length > 1) {
      const curve = new THREE.CatmullRomCurve3(moonPoints);
      const smooth = curve.getPoints(100);
      const geo = new THREE.BufferGeometry().setFromPoints(smooth);
      const mat = new THREE.LineDashedMaterial({
        color: 0x5d6d7e,
        transparent: true,
        opacity: 0.3,
        dashSize: 1,
        gapSize: 0.5,
      });
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      s.moonOrbitLine = line;
      s.scene.add(s.moonOrbitLine);
    }
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] rounded-xl overflow-hidden" />
  );
}
