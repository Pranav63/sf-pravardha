import { useEffect, useRef, useState } from 'react';
import type { MotionValue } from 'motion/react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function roundedRectangle(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2, y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function portal(width: number, height: number, border: number, depth: number) {
  const shape = roundedRectangle(width, height, .38);
  const opening = roundedRectangle(width - border * 2, height - border * 2, .2);
  shape.holes.push(new THREE.Path(opening.getPoints(24).reverse()));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelSegments: 5, steps: 1,
    bevelSize: .045, bevelThickness: .045, curveSegments: 24,
  });
  geometry.center();
  return geometry;
}

type Props = { progress: MotionValue<number>; chapter: number; pinned: boolean; reducedMotion: boolean };

export default function ServiceSculpture({ progress, chapter, pinned, reducedMotion }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const settings = useRef({ chapter, pinned, reducedMotion });
  const invalidate = useRef<() => void>(() => {});
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    settings.current = { chapter, pinned, reducedMotion };
    invalidate.current();
  }, [chapter, pinned, reducedMotion]);

  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      setUnavailable(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .95;
    renderer.domElement.dataset.testid = 'sculpture-canvas';
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(getComputedStyle(element).getPropertyValue('--cream').trim());
    const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, .1, 50);
    camera.position.set(0, .6, 8);
    camera.lookAt(0, 0, 0);
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();

    const glass = new THREE.MeshPhysicalMaterial({
      color: '#82ac92', roughness: .12, metalness: .04, transmission: .72,
      thickness: .7, ior: 1.48, attenuationColor: '#17633e', attenuationDistance: 1.8,
      clearcoat: 1, envMapIntensity: 1,
    });
    const brass = new THREE.MeshPhysicalMaterial({ color: '#bca370', metalness: 1, roughness: .25, envMapIntensity: 1.3 });
    const jade = new THREE.MeshPhysicalMaterial({
      color: '#cfdfcf', roughness: .16, transmission: .88, thickness: .4,
      ior: 1.35, attenuationColor: '#8daf86', attenuationDistance: 3, envMapIntensity: .8,
    });
    const sculpture = new THREE.Group();
    const outer = new THREE.Mesh(portal(2.25, 2.85, .28, .42), glass);
    outer.position.set(-.35, .12, 0);
    outer.rotation.z = -.16;
    const middle = new THREE.Mesh(portal(2.1, 2.35, .18, .28), brass);
    middle.rotation.set(.95, .55, .65);
    middle.position.set(.18, -.02, .12);
    const inner = new THREE.Mesh(portal(1.55, 2.1, .23, .32), jade);
    inner.rotation.set(-.35, 1.25, -.15);
    inner.position.set(.48, -.1, -.18);
    sculpture.add(outer, middle, inner);
    scene.add(sculpture);
    scene.add(new THREE.HemisphereLight('#fff8e9', '#7d9580', .8));
    const keyLight = new THREE.DirectionalLight('#fff6dc', 2);
    keyLight.position.set(-3, 5, 4);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight('#dbe9de', 1);
    rimLight.position.set(4, 2, -3);
    scene.add(rimLight);

    // A procedural contact shadow grounds the geometry without an image download.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 128;
    const context = shadowCanvas.getContext('2d')!;
    const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(32,62,43,0.2)');
    gradient.addColorStop(1, 'rgba(32,62,43,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
    const shadowGeometry = new THREE.PlaneGeometry(4.5, 3.1);
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.62;
    scene.add(shadow);

    let frame = 0;
    let visible = false;
    let rendered = false;
    let lastTime = 0;
    let pose = settings.current.reducedMotion ? settings.current.chapter / 2 : progress.get();
    let previousChapter = settings.current.chapter;
    let wasReduced = settings.current.reducedMotion;
    let frozenPose = pose;
    let frameCount = 0;

    function draw(time: number) {
      frame = 0;
      if (!visible || document.hidden) return;
      const current = settings.current;
      if (current.reducedMotion && !wasReduced) frozenPose = pose;
      if (current.reducedMotion && !current.pinned && previousChapter !== current.chapter) frozenPose = current.chapter / 2;
      const target = current.reducedMotion ? frozenPose : progress.get();
      const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 1 / 60;
      pose = current.reducedMotion || !rendered ? target : THREE.MathUtils.lerp(pose, target, 1 - Math.exp(-delta * 12));
      if (Math.abs(pose - target) < .0001) pose = target;
      // Only viewing angles change. Position, scale and screen-space framing remain fixed.
      sculpture.rotation.set(-.16 + pose * .27, -.65 + pose * 2.5, 0);
      renderer.render(scene, camera);
      element.dataset.renderer = 'webgl';
      element.dataset.yaw = sculpture.rotation.y.toFixed(4);
      element.dataset.pitch = sculpture.rotation.x.toFixed(4);
      element.dataset.frame = String(++frameCount);
      previousChapter = current.chapter;
      wasReduced = current.reducedMotion;
      lastTime = time;
      rendered = true;
      if (pose !== target) requestDraw();
    }
    function requestDraw() {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw);
    }
    function resize() {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      const aspect = width / height;
      const view = aspect < 1 ? 4.8 / aspect : 4.8;
      camera.left = -view * aspect / 2;
      camera.right = view * aspect / 2;
      camera.top = view / 2;
      camera.bottom = -view / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      requestDraw();
    }
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { lastTime = 0; requestDraw(); }
      else { cancelAnimationFrame(frame); frame = 0; }
    }, { rootMargin: '150px' });
    intersection.observe(element);
    const size = new ResizeObserver(resize);
    size.observe(element);
    const unsubscribe = progress.on('change', () => {
      if (!settings.current.reducedMotion) requestDraw();
    });
    const visibility = () => { if (!document.hidden) requestDraw(); };
    document.addEventListener('visibilitychange', visibility);
    invalidate.current = requestDraw;
    resize();

    return () => {
      cancelAnimationFrame(frame);
      intersection.disconnect();
      size.disconnect();
      unsubscribe();
      document.removeEventListener('visibilitychange', visibility);
      invalidate.current = () => {};
      [outer, middle, inner].forEach((mesh) => mesh.geometry.dispose());
      [glass, brass, jade, shadowMaterial].forEach((material) => material.dispose());
      shadowGeometry.dispose();
      shadowTexture.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [progress]);

  return <div ref={host} className="service-sculpture" data-testid="service-sculpture" aria-hidden="true">
    {unavailable && <svg className="sculpture-fallback" viewBox="0 0 400 400"><rect x="80" y="55" width="190" height="270" rx="28" /><rect x="140" y="100" width="170" height="220" rx="26" /></svg>}
  </div>;
}
