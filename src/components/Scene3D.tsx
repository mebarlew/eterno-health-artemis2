"use client";

import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { MissionData } from "@/types/mission";

const SCALE = 1 / 8000;
const EARTH_RADIUS = 2.5;
const MOON_RADIUS = 1.0;

export type FocusTarget = "earth" | "moon" | "orion" | "overview";
export type FocusFn = (target: FocusTarget) => void;

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

function createOutline(geo: THREE.BufferGeometry, color: number, scale: number): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.setScalar(scale);
  return mesh;
}

function buildRocket(): THREE.Group {
  const rocket = new THREE.Group();
  const grad = createToonGradient([0x2ecc71, 0x58d68d, 0x88e59c, 0xabebc6]);

  // Body cylinder
  const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.4, 8);
  const bodyMat = new THREE.MeshToonMaterial({ color: 0xf0f0f0, gradientMap: grad });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  rocket.add(body);
  // Body outline
  rocket.add(createOutline(bodyGeo, 0x1a5032, 1.1));

  // Nose cone
  const noseGeo = new THREE.ConeGeometry(0.25, 0.6, 8);
  const noseMat = new THREE.MeshToonMaterial({ color: 0x88e59c, gradientMap: grad });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.y = 1.0;
  rocket.add(nose);
  rocket.add(createOutline(noseGeo, 0x1a5032, 1.1));
  rocket.children[rocket.children.length - 1].position.y = 1.0;

  // Window
  const windowGeo = new THREE.SphereGeometry(0.1, 12, 12);
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x5dade2 });
  const win = new THREE.Mesh(windowGeo, windowMat);
  win.position.set(0, 0.35, 0.26);
  rocket.add(win);

  // Fins (3 around the base)
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0.35, -0.15);
  finShape.lineTo(0.1, 0.5);
  finShape.lineTo(0, 0.4);
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.04, bevelEnabled: false });
  const finMat = new THREE.MeshToonMaterial({ color: 0xe74c3c, gradientMap: createToonGradient([0xc0392b, 0xe74c3c, 0xf1948a]) });

  for (let i = 0; i < 3; i++) {
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.y = -0.7;
    fin.rotation.y = (i * Math.PI * 2) / 3;
    fin.position.x = Math.sin(fin.rotation.y) * 0.25;
    fin.position.z = Math.cos(fin.rotation.y) * 0.25;
    rocket.add(fin);
  }

  // Thruster flame
  const flameGeo = new THREE.ConeGeometry(0.2, 0.8, 6);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xf39c12, transparent: true, opacity: 0.8 });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.y = -1.1;
  flame.rotation.x = Math.PI;
  flame.name = "flame";
  rocket.add(flame);

  // Inner flame
  const innerFlameGeo = new THREE.ConeGeometry(0.1, 0.5, 6);
  const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xffeaa7, transparent: true, opacity: 0.9 });
  const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
  innerFlame.position.y = -1.0;
  innerFlame.rotation.x = Math.PI;
  innerFlame.name = "innerFlame";
  rocket.add(innerFlame);

  return rocket;
}

export default function Scene3D({ data, onReady }: { data: MissionData | null; onReady?: (focus: FocusFn) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    rocketGroup: THREE.Group;
    moonGroup: THREE.Group;
    earthGroup: THREE.Group;
    trajectoryLine: THREE.Mesh | null;
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
    camera.position.set(5, 45, 55);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 200;
    controls.target.set(0, 0, 0);
    controls.enablePan = true;
    renderer.domElement.addEventListener("dblclick", (e) => e.stopPropagation());

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(30, 30, 20);
    scene.add(sunLight);

    // === EARTH ===
    const earthGroup = new THREE.Group();
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 32, 32);
    const earthGrad = createToonGradient([0x1a5276, 0x2e86c1, 0x5dade2, 0x85c1e9]);
    const earthMat = new THREE.MeshToonMaterial({ color: 0x3498db, gradientMap: earthGrad });
    earthGroup.add(new THREE.Mesh(earthGeo, earthMat));
    earthGroup.add(createOutline(earthGeo, 0x1a3550, 1.06));

    const atmosphereGeo = new THREE.RingGeometry(EARTH_RADIUS * 1.02, EARTH_RADIUS * 1.18, 64);
    const atmosphereMat = new THREE.MeshBasicMaterial({ color: 0x5dade2, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    atmosphere.lookAt(camera.position);
    earthGroup.add(atmosphere);

    // Face
    const eyeWhiteGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });

    [[-0.55, 0.5], [0.55, 0.5]].forEach(([ex, ey]) => {
      const eye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      eye.position.set(ex, ey, EARTH_RADIUS * 0.92);
      earthGroup.add(eye);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(ex, ey - 0.05, EARTH_RADIUS * 0.92 + 0.22);
      earthGroup.add(pupil);
    });

    const smileCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.5, -0.2, EARTH_RADIUS * 0.95),
      new THREE.Vector3(0, -0.6, EARTH_RADIUS * 0.98),
      new THREE.Vector3(0.5, -0.2, EARTH_RADIUS * 0.95),
    );
    const smileGeo = new THREE.TubeGeometry(smileCurve, 20, 0.06, 8, false);
    earthGroup.add(new THREE.Mesh(smileGeo, new THREE.MeshBasicMaterial({ color: 0x1a1a2e })));
    scene.add(earthGroup);

    // === MOON ===
    const moonGroup = new THREE.Group();
    const moonGeo = new THREE.SphereGeometry(MOON_RADIUS, 32, 32);
    const moonGrad = createToonGradient([0x7f8c8d, 0xbdc3c7, 0xecf0f1]);
    moonGroup.add(new THREE.Mesh(moonGeo, new THREE.MeshToonMaterial({ color: 0xd5d8dc, gradientMap: moonGrad })));
    moonGroup.add(createOutline(moonGeo, 0x5d6d7e, 1.08));

    const craterGeo = new THREE.SphereGeometry(0.15, 12, 12);
    const craterMat = new THREE.MeshToonMaterial({ color: 0x95a5a6, gradientMap: moonGrad });
    [[0.3, 0.4, 0.85], [-0.2, -0.1, 0.9], [0.1, -0.35, 0.88]].forEach(([cx, cy, cz]) => {
      const crater = new THREE.Mesh(craterGeo, craterMat);
      crater.position.set(cx, cy, MOON_RADIUS * cz);
      crater.scale.set(1, 1, 0.3);
      moonGroup.add(crater);
    });
    scene.add(moonGroup);

    // === ROCKET ===
    const rocketGroup = buildRocket();
    rocketGroup.scale.setScalar(2.5);
    scene.add(rocketGroup);

    // === STARS ===
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 400;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 600;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 600;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffeaa7, size: 1.2, sizeAttenuation: true })));

    // Big decorative stars
    const bigStarGeo = new THREE.OctahedronGeometry(0.6, 0);
    const bigStarMat = new THREE.MeshBasicMaterial({ color: 0xffeaa7 });
    [[40, 30, -50], [-50, 20, -30], [30, -25, -60], [-35, 35, 40], [55, -10, 20]].forEach(([bx, by, bz]) => {
      const star = new THREE.Mesh(bigStarGeo, bigStarMat);
      star.position.set(bx, by, bz);
      scene.add(star);
    });

    const state = {
      renderer, scene, camera, controls,
      rocketGroup, moonGroup, earthGroup,
      trajectoryLine: null as THREE.Mesh | null,
      moonOrbitLine: null as THREE.Line | null,
      animId: 0,
    };

    function animate() {
      state.animId = requestAnimationFrame(animate);
      controls.update();

      const t = Date.now() * 0.001;

      earthGroup.rotation.y = t * 0.1;
      earthGroup.position.y = Math.sin(t * 0.5) * 0.3;
      atmosphere.lookAt(camera.position);

      // Rocket thruster flicker
      rocketGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.name === "flame") {
            (child.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(t * 8) * 0.3;
            child.scale.y = 0.8 + Math.sin(t * 6) * 0.4;
          }
          if (child.name === "innerFlame") {
            (child.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(t * 10) * 0.3;
            child.scale.y = 0.7 + Math.sin(t * 7) * 0.3;
          }
        }
      });

      moonGroup.position.y += Math.sin(t * 0.7 + 2) * 0.002;

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

    // Expose focusOn with smart camera positioning
    const focusOnFn: FocusFn = (target) => {
      const rocketPos = rocketGroup.position.clone();
      const moonPos = moonGroup.position.clone();
      const earthPos = earthGroup.position.clone();
      const midpoint = earthPos.clone().add(moonPos).multiplyScalar(0.5);

      let lookAt: THREE.Vector3;
      let endPos: THREE.Vector3;

      if (target === "overview") {
        lookAt = midpoint;
        const span = earthPos.distanceTo(moonPos);
        endPos = midpoint.clone().add(new THREE.Vector3(0, span * 0.6, span * 0.5));
      } else if (target === "orion") {
        lookAt = rocketPos.clone();
        const toMoon = moonPos.clone().sub(rocketPos).normalize();
        endPos = rocketPos.clone().sub(toMoon.multiplyScalar(10)).add(new THREE.Vector3(0, 4, 0));
      } else if (target === "earth") {
        lookAt = earthPos.clone();
        const toRocket = rocketPos.clone().sub(earthPos).normalize();
        endPos = earthPos.clone().sub(toRocket.multiplyScalar(14)).add(new THREE.Vector3(0, 6, 0));
      } else {
        lookAt = moonPos.clone();
        const toRocket = rocketPos.clone().sub(moonPos).normalize();
        endPos = moonPos.clone().add(toRocket.multiplyScalar(10)).add(new THREE.Vector3(0, 4, 0));
      }

      const startCamPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const duration = 1200;
      const startTime = Date.now();

      function animateCamera() {
        const elapsed = Date.now() - startTime;
        const p = Math.min(elapsed / duration, 1);
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

        camera.position.lerpVectors(startCamPos, endPos, ease);
        controls.target.lerpVectors(startTarget, lookAt, ease);
        controls.update();

        if (p < 1) requestAnimationFrame(animateCamera);
      }
      animateCamera();
    };

    onReady?.(focusOnFn);

    const onResizeFn = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    window.addEventListener("resize", onResizeFn);

    return () => {
      window.removeEventListener("resize", onResizeFn);
      cancelAnimationFrame(state.animId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [onReady]);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  useEffect(() => {
    if (!sceneRef.current || !data) return;
    const s = sceneRef.current;

    // Position rocket
    const ox = data.current.orion.x * SCALE;
    const oy = data.current.orion.z * SCALE;
    const oz = -data.current.orion.y * SCALE;
    s.rocketGroup.position.set(ox, oy, oz);

    // Point rocket along velocity
    const vel = new THREE.Vector3(data.current.orion.vx, data.current.orion.vz, -data.current.orion.vy).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, vel);
    s.rocketGroup.quaternion.copy(quat);

    // Position Moon
    const mx = data.current.moon.x * SCALE;
    const my = data.current.moon.z * SCALE;
    const mz = -data.current.moon.y * SCALE;
    s.moonGroup.position.set(mx, my, mz);

    // === Trajectory: traveled (bright) + future (dim dashed) ===
    if (s.trajectoryLine) {
      s.scene.remove(s.trajectoryLine);
      s.trajectoryLine.geometry.dispose();
      s.trajectoryLine = null;
    }
    if (s.moonOrbitLine) {
      s.scene.remove(s.moonOrbitLine);
      s.moonOrbitLine.geometry.dispose();
      s.moonOrbitLine = null;
    }

    const now = new Date();
    const trajPoints = data.trajectory.map((p) => new THREE.Vector3(p.x * SCALE, p.z * SCALE, -p.y * SCALE));

    if (trajPoints.length > 1) {
      // Split trajectory into past and future segments
      const t0 = new Date(data.trajectory[0].timestamp).getTime();
      const tEnd = new Date(data.trajectory[data.trajectory.length - 1].timestamp).getTime();
      const nowMs = now.getTime();
      const frac = Math.max(0, Math.min(1, (nowMs - t0) / (tEnd - t0)));

      const fullCurve = new THREE.CatmullRomCurve3(trajPoints);
      const totalSamples = 300;
      const splitIndex = Math.max(1, Math.floor(frac * totalSamples));

      const allPoints = fullCurve.getPoints(totalSamples);
      const pastPoints = allPoints.slice(0, splitIndex + 1);
      const futurePoints = allPoints.slice(splitIndex);

      // Past trajectory: bright solid tube
      if (pastPoints.length > 1) {
        const pastCurve = new THREE.CatmullRomCurve3(pastPoints);
        const pastTube = new THREE.TubeGeometry(pastCurve, pastPoints.length * 2, 0.12, 6, false);
        const pastMat = new THREE.MeshToonMaterial({
          color: 0x88e59c,
          gradientMap: createToonGradient([0x2ecc71, 0x58d68d, 0x88e59c]),
        });
        const pastMesh = new THREE.Mesh(pastTube, pastMat);
        s.scene.add(pastMesh);
        s.trajectoryLine = pastMesh;
      }

      // Future trajectory: dim dashed line
      if (futurePoints.length > 1) {
        const futureGeo = new THREE.BufferGeometry().setFromPoints(futurePoints);
        const futureMat = new THREE.LineDashedMaterial({
          color: 0x88e59c,
          transparent: true,
          opacity: 0.3,
          dashSize: 0.8,
          gapSize: 0.4,
        });
        const futureLine = new THREE.Line(futureGeo, futureMat);
        futureLine.computeLineDistances();
        s.scene.add(futureLine);
        s.moonOrbitLine = futureLine; // reuse ref for cleanup
      }

      // Direction arrows along future path (small cones every ~20% of future)
      const arrowGeo = new THREE.ConeGeometry(0.15, 0.4, 4);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0x88e59c, transparent: true, opacity: 0.4 });
      for (let i = 1; i < futurePoints.length - 1; i += Math.floor(futurePoints.length / 5)) {
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        arrow.position.copy(futurePoints[i]);
        const dir = futurePoints[i + 1].clone().sub(futurePoints[i]).normalize();
        const arrowUp = new THREE.Vector3(0, 1, 0);
        arrow.quaternion.setFromUnitVectors(arrowUp, dir);
        s.scene.add(arrow);
      }
    }
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] rounded-xl overflow-hidden" />
  );
}
