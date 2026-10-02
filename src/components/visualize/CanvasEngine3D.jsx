import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import useAppStore from '../../stores/appStore.js';
import StateHUD from './StateHUD.jsx';
import './CanvasEngine3D.css';

// Create an extensible THREE proxy for generated scripts (ES modules are non-extensible)
const threeExtended = new Proxy(THREE, {
  get(target, prop) {
    if (prop === 'ParametricGeometry') {
      return ParametricGeometry;
    }
    return target[prop];
  }
});

/**
 * CanvasEngine3D — Interactive Multi-Dimensional 3D Spatial Canvas Engine
 * Supports 3-axis rotation, orbital navigation, isometric projection,
 * volumetric data structures, 3D neural layers, network graphs, and procedural meshes.
 */
export default function CanvasEngine3D({ code: propCode }) {
  const wrapperRef = useRef(null);
  const mountRef = useRef(null);
  const gizmoMountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const contentGroupRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const animatedObjectsRef = useRef([]);

  // Gizmo refs
  const gizmoRendererRef = useRef(null);
  const gizmoSceneRef = useRef(null);
  const gizmoCameraRef = useRef(null);

  // Model bounds for accurate camera preset framing
  const modelBoundsRef = useRef({ center: new THREE.Vector3(0, 0, 0), distance: 45 });

  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [activePreset, setActivePreset] = useState('perspective');

  // ── New 3D Environment & Kinematics Control States ──────────
  const [bgColor, setBgColor] = useState('#07090e');
  const [lightingMode, setLightingMode] = useState('studio'); // 'studio' | 'cyber' | 'sunlight' | 'soft'
  const [isPaused, setIsPaused] = useState(false);
  const [animSpeed, setAnimSpeed] = useState(1);
  const [showEnvMenu, setShowEnvMenu] = useState(false);
  const [showLightingMenu, setShowLightingMenu] = useState(false);
  const [showViewsMenu, setShowViewsMenu] = useState(false);

  // Refs for animation loop so toggling pause/speed does NOT destroy the scene
  const isPausedRef = useRef(isPaused);
  const animSpeedRef = useRef(animSpeed);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    animSpeedRef.current = animSpeed;
  }, [animSpeed]);

  // Lighting & Grid Refs
  const ambientLightRef = useRef(null);
  const dirLight1Ref = useRef(null);
  const dirLight2Ref = useRef(null);
  const pointLightRef = useRef(null);
  const gridHelperRef = useRef(null);
  const elapsedTimeRef = useRef(0);

  const { active3DCode, isAiTyping, activeConcept } = useAppStore();
  const current3DCode = propCode || active3DCode;
  const visualization = current3DCode ? { type: 'javascript', code: current3DCode } : null;
  const isGenerating = isAiTyping;
  const currentStep = 0;
  const steps = [];

  // ── Helper: Fit Camera to 3D Geometry Bounds ───────────────
  const fitCameraToBounds = useCallback((targetGroup) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const group = targetGroup || contentGroupRef.current || sceneRef.current;
    if (!camera || !controls || !group) return;

    const box = new THREE.Box3();
    let hasMeshes = false;
    group.traverse((child) => {
      if (child.isMesh && child.geometry && child.name !== 'gridHelper' && child.name !== 'axesHelper') {
        box.expandByObject(child);
        hasMeshes = true;
      }
    });

    if (!hasMeshes) {
      box.setFromObject(group);
    }

    if (box.isEmpty()) return;

    const center = new THREE.Vector3();
    box.getCenter(center);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 2);

    const fov = camera.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.35;
    cameraDistance = Math.max(cameraDistance, 8);

    modelBoundsRef.current = { center, distance: cameraDistance };

    controls.target.copy(center);
    camera.position.set(center.x + cameraDistance * 0.7, center.y + cameraDistance * 0.55, center.z + cameraDistance * 0.7);
    camera.lookAt(center);
    controls.update();
  }, []);

  // ── Helper: Create Billboard Text Sprite ────────────────────
  const createTextSprite = (text, { color = '#ffffff', fontSize = 26, bg = 'rgba(15, 23, 42, 0.75)', borderColor = 'rgba(99, 102, 241, 0.6)' } = {}) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 384;
    canvas.height = 100;

    // Rounded rectangle background
    const x = 8, y = 8, w = 368, h = 84, r = 16;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = bg;
    ctx.fill();

    // Border
    ctx.lineWidth = 3;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    // Crisp text
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 192, 50);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.8, 0.5, 1);
    sprite.name = 'labelSprite';
    sprite.visible = showLabels;
    return sprite;
  };

  // ── Initialize Main Three.js Scene ─────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    scene.fog = null;
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(35, 28, 42);
    cameraRef.current = camera;

    // 3. Renderer (High-Performance 60FPS)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(new THREE.Color(bgColor), 1.0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls (Full 3-Axis Rotation)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = true;
    controls.minDistance = 2;
    controls.maxDistance = 600;
    controls.maxPolarAngle = Math.PI; // Full 360 vertical rotation enabled
    controls.minPolarAngle = 0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight1 = new THREE.DirectionalLight(0x818cf8, 1.8);
    dirLight1.position.set(30, 50, 30);
    dirLight1.castShadow = true;
    scene.add(dirLight1);
    dirLight1Ref.current = dirLight1;

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight2.position.set(-30, -20, -30);
    scene.add(dirLight2);
    dirLight2Ref.current = dirLight2;

    const pointLight = new THREE.PointLight(0xa855f7, 2, 80);
    pointLight.position.set(0, 15, 0);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    // 6. Cyber Grid Floor
    const gridHelper = new THREE.GridHelper(80, 40, 0x4f46e5, 0x1e1b4b);
    gridHelper.position.y = -10;
    gridHelper.name = 'gridHelper';
    gridHelper.visible = showGrid;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // 7. Content Group
    const contentGroup = new THREE.Group();
    contentGroup.name = 'contentGroup';
    scene.add(contentGroup);
    contentGroupRef.current = contentGroup;

    // ── Setup 3D Orientation Gizmo ───────────────────────────
    const gizmoContainer = gizmoMountRef.current;
    if (gizmoContainer) {
      const gizmoSize = 80;
      const gizmoScene = new THREE.Scene();
      const gizmoCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 50);
      gizmoCamera.position.set(0, 0, 5);

      const gizmoRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      gizmoRenderer.setSize(gizmoSize, gizmoSize);
      gizmoRenderer.setPixelRatio(window.devicePixelRatio);
      gizmoContainer.innerHTML = '';
      gizmoContainer.appendChild(gizmoRenderer.domElement);

      const axesHelper = new THREE.AxesHelper(1.4);
      axesHelper.material.linewidth = 3;
      gizmoScene.add(axesHelper);

      // Spherical indicators on axis tips
      const sphereGeo = new THREE.SphereGeometry(0.18, 16, 16);
      // X = Red
      const xSphere = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      xSphere.position.set(1.4, 0, 0);
      gizmoScene.add(xSphere);
      // Y = Green
      const ySphere = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      ySphere.position.set(0, 1.4, 0);
      gizmoScene.add(ySphere);
      // Z = Blue
      const zSphere = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
      zSphere.position.set(0, 0, 1.4);
      gizmoScene.add(zSphere);

      gizmoSceneRef.current = gizmoScene;
      gizmoCameraRef.current = gizmoCamera;
      gizmoRendererRef.current = gizmoRenderer;
    }

    // 8. Animation Loop with Kinematic Play/Pause & Speed Handling
    let prevTime = performance.now();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const currentTime = performance.now();
      const rawDelta = Math.min((currentTime - prevTime) / 1000, 0.1);
      prevTime = currentTime;
      const currentSpeed = typeof animSpeedRef.current === 'number' ? animSpeedRef.current : 1;
      const delta = isPausedRef.current ? 0 : rawDelta * currentSpeed;
      elapsedTimeRef.current += delta;
      const time = elapsedTimeRef.current;

      controls.update();

      // Animate active parts & kinematic scripts
      if (!isPausedRef.current && animatedObjectsRef.current.length > 0) {
        animatedObjectsRef.current.forEach((obj) => {
          if (obj.userData?.update) {
            obj.userData.update(time, delta);
          }
        });
      }

      // Sync Gizmo orientation with main camera
      if (gizmoCameraRef.current && gizmoRendererRef.current && gizmoSceneRef.current) {
        gizmoCameraRef.current.position.copy(camera.position).sub(controls.target).normalize().multiplyScalar(4);
        gizmoCameraRef.current.lookAt(0, 0, 0);
        gizmoCameraRef.current.up.copy(camera.up);
        gizmoRendererRef.current.render(gizmoSceneRef.current, gizmoCameraRef.current);
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize handler with ResizeObserver
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // ── Dynamic Background Environment Updater ────────────────
  useEffect(() => {
    const col = new THREE.Color(bgColor);
    if (sceneRef.current) {
      sceneRef.current.background = col;
      sceneRef.current.fog = null;
    }
    if (rendererRef.current) {
      rendererRef.current.setClearColor(col, 1.0);
    }

    // Adjust ambient lighting and grid for light backdrops
    const isLight = col.r * 0.299 + col.g * 0.587 + col.b * 0.114 > 0.5;
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isLight ? 1.6 : 0.8;
      ambientLightRef.current.color.setHex(isLight ? 0xffffff : 0xffffff);
    }

    // Recreate grid helper dynamically to ensure contrast on light and dark backgrounds
    if (sceneRef.current) {
      const oldGrid = sceneRef.current.getObjectByName('gridHelper');
      if (oldGrid) {
        sceneRef.current.remove(oldGrid);
        if (oldGrid.geometry) oldGrid.geometry.dispose();
        if (oldGrid.material) {
          if (Array.isArray(oldGrid.material)) oldGrid.material.forEach((m) => m.dispose());
          else oldGrid.material.dispose();
        }
      }
      const gridHelper = new THREE.GridHelper(
        80,
        40,
        isLight ? 0x64748b : 0x4f46e5,
        isLight ? 0xcbd5e1 : 0x1e1b4b
      );
      gridHelper.position.y = -10;
      gridHelper.name = 'gridHelper';
      gridHelper.visible = showGrid;
      sceneRef.current.add(gridHelper);
      gridHelperRef.current = gridHelper;
    }
  }, [bgColor, showGrid]);

  // ── Dynamic Studio Lighting Presets ────────────────────────
  useEffect(() => {
    if (!dirLight1Ref.current || !dirLight2Ref.current || !pointLightRef.current) return;
    switch (lightingMode) {
      case 'cyber':
        dirLight1Ref.current.color.setHex(0x06b6d4); // Cyan
        dirLight1Ref.current.intensity = 2.2;
        dirLight2Ref.current.color.setHex(0xd946ef); // Magenta
        dirLight2Ref.current.intensity = 2.0;
        pointLightRef.current.color.setHex(0xa855f7);
        pointLightRef.current.intensity = 2.5;
        break;
      case 'sunlight':
        dirLight1Ref.current.color.setHex(0xfef08a); // Warm Sunlight
        dirLight1Ref.current.intensity = 3.0;
        dirLight1Ref.current.position.set(40, 60, 40);
        dirLight2Ref.current.color.setHex(0x64748b); // Cool Sky Fill
        dirLight2Ref.current.intensity = 0.8;
        pointLightRef.current.intensity = 0.4;
        break;
      case 'soft':
        dirLight1Ref.current.color.setHex(0xffffff);
        dirLight1Ref.current.intensity = 1.1;
        dirLight2Ref.current.color.setHex(0xffffff);
        dirLight2Ref.current.intensity = 1.1;
        pointLightRef.current.intensity = 0.6;
        break;
      case 'studio':
      default:
        dirLight1Ref.current.color.setHex(0x818cf8);
        dirLight1Ref.current.intensity = 1.8;
        dirLight1Ref.current.position.set(30, 50, 30);
        dirLight2Ref.current.color.setHex(0x38bdf8);
        dirLight2Ref.current.intensity = 1.2;
        pointLightRef.current.color.setHex(0xa855f7);
        pointLightRef.current.intensity = 2.0;
        break;
    }
  }, [lightingMode]);

  // ── Close Popovers on Click Outside ───────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.toolbar-menu-wrapper')) {
        setShowEnvMenu(false);
        setShowLightingMenu(false);
        setShowViewsMenu(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  // ── Toggle Auto-Rotation ───────────────────────────────────
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 1.8;
    }
  }, [autoRotate]);

  // ── Toggle Grid Floor ──────────────────────────────────────
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
    if (sceneRef.current) {
      const grid = sceneRef.current.getObjectByName('gridHelper');
      if (grid) grid.visible = showGrid;
    }
  }, [showGrid]);

  // ── Toggle Wireframe Mode ──────────────────────────────────
  useEffect(() => {
    const root = sceneRef.current;
    if (root) {
      root.traverse((child) => {
        if (child.isMesh && child.material && child.name !== 'gridHelper' && child.name !== 'axesHelper') {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => (m.wireframe = wireframe));
          } else {
            child.material.wireframe = wireframe;
          }
        }
      });
    }
  }, [wireframe]);

  // ── Camera Preset Handlers ─────────────────────────────────
  const setCameraPreset = useCallback((preset) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    setActivePreset(preset);
    const bounds = modelBoundsRef.current || { center: new THREE.Vector3(0, 0, 0), distance: 45 };
    const center = bounds.center || new THREE.Vector3(0, 0, 0);
    const dist = bounds.distance || 45;

    controls.target.copy(center);

    switch (preset) {
      case 'iso': // Isometric 3D
        camera.position.set(center.x + dist * 0.7, center.y + dist * 0.7, center.z + dist * 0.7);
        break;
      case 'top': // Top XY Plane
        camera.position.set(center.x, center.y + dist, center.z + 0.001);
        break;
      case 'front': // Front XZ Plane
        camera.position.set(center.x, center.y, center.z + dist);
        break;
      case 'side': // Side YZ Plane
        camera.position.set(center.x + dist, center.y, center.z);
        break;
      case 'bottom': // Bottom -XY Plane
        camera.position.set(center.x, center.y - dist, center.z + 0.001);
        break;
      case 'perspective':
      default:
        camera.position.set(center.x + dist * 0.7, center.y + dist * 0.55, center.z + dist * 0.7);
        break;
    }
    camera.lookAt(center);
    controls.update();
  }, []);

  // ── Build 3D Visualization Content ────────────────────────
  useEffect(() => {
    const group = contentGroupRef.current;
    if (!group) return;

    // Clear previous 3D content
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }
    animatedObjectsRef.current = [];

    const data = visualization;
    if (!data) {
      // Default Empty 3D Spatial Demo: Holographic Polyhedron Ring & Kinetic Node Cluster
      buildDemoScene(group);
      return;
    }

    const type = (data.type || '').toLowerCase();

    // 1. Dynamic Live Generative 3D Mesh / Three.js Code Runner (PRIMARY)
    if (data.code || data.threeCode || type === 'three' || type === 'javascript' || type === 'js') {
      executeGenerative3DCode(group, data.code || data.threeCode || data);
    }
    // 2. 3D Physical / Mechanical / CAD Assembly Model
    else if (
      type === 'assembly' ||
      data.parts ||
      data.geometries ||
      type.includes('engine') ||
      type.includes('cad') ||
      type.includes('mechanic') ||
      type.includes('transistor') ||
      type.includes('antenna') ||
      type.includes('device') ||
      type.includes('piston') ||
      type.includes('hardware')
    ) {
      build3DAssembly(group, data);
    }
    // 3. 3D Molecule / Chemistry Model
    else if (type.includes('molecule') || type.includes('chem') || data.atoms || data.bonds) {
      build3DMolecule(group, data);
    }
    // 4. 3D / 2D Graph / Network / Microservices
    else if (type.includes('graph') || type.includes('network') || data.nodes) {
      build3DGraph(group, data);
    }
    // 5. 3D / 2D Tree / Hierarchy
    else if (type.includes('tree') || data.root) {
      build3DTree(group, data);
    }
    // 6. 3D / 2D Array / Tensor / Matrix
    else if (type.includes('array') || type.includes('tensor') || data.values) {
      build3DArrayTensor(group, data);
    }
    // 7. 3D Architecture / Microservices / Software Infrastructure
    else if ((type.includes('architecture') || type.includes('system') || data.layers || data.services) && !data.parts) {
      build3DArchitecture(group, data);
    }
    // 8. 3D Math Function / Parametric Surface
    else if (type.includes('math') || type.includes('function') || data.fn || data.equation) {
      build3DMathSurface(group, data);
    }
    // Fallback: Elevate any structured entity to 3D Isometric View
    else {
      buildVolumetricFallback(group, data);
    }

    // Apply current wireframe and label states to newly generated geometry
    if (wireframe) {
      group.traverse((child) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => (m.wireframe = true));
          else child.material.wireframe = true;
        }
      });
    }

    // Auto-focus camera on the generated 3D bounds
    fitCameraToBounds(group);
  }, [visualization]);

  // ── Toggle Label Annotations Visibility ────────────────────
  useEffect(() => {
    const root = sceneRef.current;
    if (root) {
      root.traverse((child) => {
        if (child.isSprite || child.name === 'labelSprite' || child.type === 'Sprite') {
          child.visible = showLabels;
        }
      });
    }
  }, [showLabels]);

  // ── 3D Scene Builder: Chemistry & Molecular Models ──────────
  const build3DMolecule = (group, data) => {
    const rawAtoms = data.atoms || [
      { id: 'C1', symbol: 'C', x: 0, y: 3, z: 0 },
      { id: 'C2', symbol: 'C', x: 2.6, y: 1.5, z: 0 },
      { id: 'C3', symbol: 'C', x: 2.6, y: -1.5, z: 0 },
      { id: 'C4', symbol: 'C', x: 0, y: -3, z: 0 },
      { id: 'C5', symbol: 'C', x: -2.6, y: -1.5, z: 0 },
      { id: 'C6', symbol: 'C', x: -2.6, y: 1.5, z: 0 },
      { id: 'H1', symbol: 'H', x: 0, y: 5.2, z: 0 },
      { id: 'H2', symbol: 'H', x: 4.5, y: 2.6, z: 0 },
      { id: 'H3', symbol: 'H', x: 4.5, y: -2.6, z: 0 },
      { id: 'H4', symbol: 'H', x: 0, y: -5.2, z: 0 },
      { id: 'H5', symbol: 'H', x: -4.5, y: -2.6, z: 0 },
      { id: 'H6', symbol: 'H', x: -4.5, y: 2.6, z: 0 },
    ];

    const rawBonds = data.bonds || [
      { from: 'C1', to: 'C2', order: 2 },
      { from: 'C2', to: 'C3', order: 1 },
      { from: 'C3', to: 'C4', order: 2 },
      { from: 'C4', to: 'C5', order: 1 },
      { from: 'C5', to: 'C6', order: 2 },
      { from: 'C6', to: 'C1', order: 1 },
      { from: 'C1', to: 'H1' },
      { from: 'C2', to: 'H2' },
      { from: 'C3', to: 'H3' },
      { from: 'C4', to: 'H4' },
      { from: 'C5', to: 'H5' },
      { from: 'C6', to: 'H6' },
    ];

    const elementColors = {
      C: 0x334155, // Dark slate
      H: 0xf8fafc, // White
      O: 0xef4444, // Red
      N: 0x3b82f6, // Blue
      S: 0xeab308, // Yellow
      P: 0xf97316, // Orange
      Cl: 0x22c55e, // Green
      Na: 0xa855f7, // Purple
    };

    const elementRadii = {
      C: 1.1,
      H: 0.6,
      O: 0.95,
      N: 1.0,
      S: 1.2,
      P: 1.15,
      Cl: 1.05,
      Na: 1.3,
    };

    const atomPositions = {};

    rawAtoms.forEach((atom, i) => {
      const sym = atom.symbol || 'C';
      const color = elementColors[sym] || 0x64748b;
      const radius = elementRadii[sym] || 1.0;

      const pos = new THREE.Vector3(atom.x || 0, atom.y || 0, atom.z || 0);
      atomPositions[atom.id || i] = pos;

      const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.6,
        roughness: 0.2,
        wireframe,
      });
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.copy(pos);
      group.add(mesh);

      const label = createTextSprite(`${sym}${atom.id ? ` (${atom.id})` : ''}`, {
        fontSize: 28,
        bg: 'rgba(0,0,0,0.7)',
        borderColor: '#94a3b8',
      });
      label.scale.set(2.2, 0.7, 1);
      label.position.set(pos.x, pos.y + radius + 1.2, pos.z);
      group.add(label);
    });

    rawBonds.forEach((bond) => {
      const fromPos = atomPositions[bond.from];
      const toPos = atomPositions[bond.to];
      if (!fromPos || !toPos) return;

      const dist = fromPos.distanceTo(toPos);
      const pipeGeo = new THREE.CylinderGeometry(0.2, 0.2, dist, 16);
      const pipeMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.7,
        roughness: 0.2,
        wireframe,
      });
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      const mid = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
      pipe.position.copy(mid);
      pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), toPos.clone().sub(fromPos).normalize());
      group.add(pipe);
    });
  };

  // ── 3D Scene Builder: CAD / Physical & Mechanical Assembly ──
  const build3DAssembly = (group, data) => {
    // Default to Piston Assembly if parts is empty or generic
    const rawParts = data.parts || data.geometries || [
      { name: 'Cylinder Sleeve', shape: 'cylinder', radiusTop: 6, radiusBottom: 6, height: 20, color: '#71717a', opacity: 0.25, transparent: true, wireframe: true },
      { name: 'Piston Crown', shape: 'cylinder', radiusTop: 5.7, radiusBottom: 5.7, height: 5.5, y: 4, color: '#e4e4e7', metalness: 0.9, roughness: 0.2 },
      { name: 'Compression Rings', shape: 'torus', radius: 5.72, tube: 0.15, y: 5.5, color: '#38bdf8', metalness: 0.95 },
      { name: 'Wrist Pin', shape: 'cylinder', radiusTop: 0.9, radiusBottom: 0.9, height: 4.8, rotationZ: 1.5708, y: 3, color: '#94a3b8', metalness: 0.95 },
      { name: 'Connecting Rod', shape: 'box', width: 1.5, height: 12, depth: 1.5, y: -4, color: '#38bdf8', metalness: 0.85, roughness: 0.25 },
      { name: 'Crankshaft Web & Counterweight', shape: 'cylinder', radiusTop: 4.5, radiusBottom: 4.5, height: 2, rotationX: 1.5708, y: -11, color: '#6366f1', metalness: 0.9 },
      { name: 'Spark Plug Electrode', shape: 'cylinder', radiusTop: 0.5, radiusBottom: 0.5, height: 4, y: 12, color: '#f59e0b', metalness: 0.9 }
    ];

    const partMeshes = {};

    rawParts.forEach((part, i) => {
      const shape = (part.shape || 'cylinder').toLowerCase();
      let geometry;

      if (shape === 'cylinder') {
        const rTop = part.radiusTop ?? part.radius ?? 2;
        const rBot = part.radiusBottom ?? part.radius ?? 2;
        const h = part.height ?? 6;
        const segs = part.radialSegments ?? 32;
        geometry = new THREE.CylinderGeometry(rTop, rBot, h, segs, 1, part.openEnded || false);
      } else if (shape === 'sphere') {
        const r = part.radius ?? 2;
        geometry = new THREE.SphereGeometry(r, 32, 32);
      } else if (shape === 'torus' || shape === 'ring') {
        const r = part.radius ?? 4;
        const tube = part.tube ?? 0.4;
        geometry = new THREE.TorusGeometry(r, tube, 16, 64);
      } else if (shape === 'cone') {
        const r = part.radius ?? 2;
        const h = part.height ?? 5;
        geometry = new THREE.ConeGeometry(r, h, 32);
      } else {
        // Box fallback
        const w = part.width ?? 4;
        const h = part.height ?? 4;
        const d = part.depth ?? 4;
        geometry = new THREE.BoxGeometry(w, h, d);
      }

      // Metallic material setup
      const color = part.color || 0xd4d4d8;
      const isTransparent = part.transparent || (part.opacity !== undefined && part.opacity < 1);
      const mat = new THREE.MeshStandardMaterial({
        color,
        metalness: part.metalness ?? 0.85,
        roughness: part.roughness ?? 0.25,
        transparent: isTransparent,
        opacity: part.opacity ?? (isTransparent ? 0.35 : 1),
        wireframe: part.wireframe || wireframe,
        emissive: part.emissive || 0x000000,
        emissiveIntensity: part.emissiveIntensity || 0,
      });

      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(part.x || 0, part.y || 0, part.z || 0);

      // Rotations (support radians or degrees)
      const rx = part.rotationX ? (Math.abs(part.rotationX) > 6.28 ? (part.rotationX * Math.PI) / 180 : part.rotationX) : 0;
      const ry = part.rotationY ? (Math.abs(part.rotationY) > 6.28 ? (part.rotationY * Math.PI) / 180 : part.rotationY) : 0;
      const rz = part.rotationZ ? (Math.abs(part.rotationZ) > 6.28 ? (part.rotationZ * Math.PI) / 180 : part.rotationZ) : 0;
      mesh.rotation.set(rx, ry, rz);

      group.add(mesh);
      partMeshes[part.name || i] = mesh;

      // Part label annotation
      if (part.name || part.label) {
        const title = part.name || part.label;
        const labelSprite = createTextSprite(title, {
          fontSize: 24,
          bg: 'rgba(0,0,0,0.75)',
          borderColor: '#38bdf8',
        });
        const labelX = (part.x || 0) + (part.labelOffsetX || 8);
        const labelY = (part.y || 0) + (part.labelOffsetY || 0);
        const labelZ = (part.z || 0) + (part.labelOffsetZ || 0);
        labelSprite.scale.set(3, 0.8, 1);
        labelSprite.position.set(labelX, labelY, labelZ);
        group.add(labelSprite);

        // Fine pointer lead line from part to annotation
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(part.x || 0, part.y || 0, part.z || 0),
          new THREE.Vector3(labelX - 1.5, labelY, labelZ),
        ]);
        const lineMat = new THREE.LineDashedMaterial({
          color: 0x38bdf8,
          dashSize: 0.5,
          gapSize: 0.25,
          opacity: 0.6,
          transparent: true,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        group.add(line);
      }
    });

    // ── Kinematic Slider-Crank Physics Animation Loop ─────────
    const pistonMesh = partMeshes['Piston Crown'] || Object.values(partMeshes)[1];
    const pinMesh = partMeshes['Wrist Pin'];
    const ringsMesh = partMeshes['Compression Rings'];
    const rodMesh = partMeshes['Connecting Rod'];
    const crankMesh = partMeshes['Crankshaft Web & Counterweight'];

    if (pistonMesh && rodMesh && crankMesh) {
      const crankR = data.kinematics?.crankRadius || 4.2;
      const rodL = data.kinematics?.rodLength || 11.5;
      const crankCenterY = crankMesh.position.y;

      const animatedAssembly = new THREE.Object3D();
      animatedAssembly.userData.update = (time) => {
        const omega = 1.8;
        const theta = time * omega; // Crank rotational angle

        // Crankpin coordinate
        const crankPinX = Math.sin(theta) * crankR;
        const crankPinY = crankCenterY + Math.cos(theta) * crankR;

        // Piston wrist pin coordinate (slider motion)
        const wristY = crankCenterY + Math.cos(theta) * crankR + Math.sqrt(rodL * rodL - crankPinX * crankPinX);

        pistonMesh.position.y = wristY + 1;
        if (pinMesh) pinMesh.position.y = wristY;
        if (ringsMesh) ringsMesh.position.y = wristY + 2.5;

        // Connecting rod position & angle
        rodMesh.position.x = crankPinX / 2;
        rodMesh.position.y = (wristY + crankPinY) / 2;
        const rodAngle = Math.atan2(crankPinX, wristY - crankPinY);
        rodMesh.rotation.z = -rodAngle;

        // Crankshaft rotation
        crankMesh.rotation.z = theta;
      };

      group.add(animatedAssembly);
      animatedObjectsRef.current.push(animatedAssembly);
    }
  };

  // ── 3D Scene Builder: Demo Hologram Cluster ────────────────
  const buildDemoScene = (group) => {
    // Center glowing core
    const coreGeo = new THREE.IcosahedronGeometry(3.5, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x4338ca,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2,
      wireframe,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Outer orbital ring
    const ringGeo = new THREE.TorusGeometry(8, 0.15, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      wireframe,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    group.add(ringMesh);

    const ring2 = ringMesh.clone();
    ring2.rotation.x = -Math.PI / 3;
    ring2.rotation.y = Math.PI / 4;
    group.add(ring2);

    // Orbiting Satellite Nodes
    const numNodes = 6;
    const satellites = [];
    for (let i = 0; i < numNodes; i++) {
      const angle = (i / numNodes) * Math.PI * 2;
      const radius = 12;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(angle * 2) * 3;

      const satGeo = new THREE.SphereGeometry(1.2, 32, 32);
      const satMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xa855f7 : 0x06b6d4,
        emissive: i % 2 === 0 ? 0x7e22ce : 0x0891b2,
        emissiveIntensity: 0.7,
        metalness: 0.9,
        roughness: 0.1,
        wireframe,
      });
      const satMesh = new THREE.Mesh(satGeo, satMat);
      satMesh.position.set(x, y, z);
      group.add(satMesh);

      // Text label
      const sprite = createTextSprite(`Node 0${i + 1}`, { color: '#ffffff', fontSize: 32 });
      sprite.position.set(x, y + 2.4, z);
      group.add(sprite);

      // Connecting 3D laser line to core
      const lineMat = new THREE.LineBasicMaterial({ color: 0x4f46e5, transparent: true, opacity: 0.6 });
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]);
      const line = new THREE.Line(lineGeo, lineMat);
      group.add(line);

      satellites.push({ mesh: satMesh, sprite, line, baseAngle: angle, radius });
    }

    // Register dynamic orbit animation
    animatedObjectsRef.current.push({
      userData: {
        update: (time) => {
          coreMesh.rotation.y = time * 0.4;
          coreMesh.rotation.x = time * 0.2;
          ringMesh.rotation.z = time * 0.3;
          ring2.rotation.z = -time * 0.25;

          satellites.forEach((sat, idx) => {
            const curAngle = sat.baseAngle + time * 0.3;
            const sx = Math.cos(curAngle) * sat.radius;
            const sz = Math.sin(curAngle) * sat.radius;
            const sy = Math.sin(curAngle * 2) * 3;
            sat.mesh.position.set(sx, sy, sz);
            sat.sprite.position.set(sx, sy + 2.4, sz);

            const posAttr = sat.line.geometry.attributes.position;
            posAttr.setXYZ(1, sx, sy, sz);
            posAttr.needsUpdate = true;
          });
        },
      },
    });
  };

  // ── 3D Scene Builder: 3D Network & Graphs ──────────────────
  const build3DGraph = (group, data) => {
    const rawNodes = data.nodes || [];
    const rawEdges = data.edges || data.links || [];

    if (rawNodes.length === 0) {
      buildDemoScene(group);
      return;
    }

    // Map 3D positions
    const nodePositions = {};
    const nodeCount = rawNodes.length;

    rawNodes.forEach((node, idx) => {
      let x = node.x !== undefined ? (node.x - 400) / 25 : 0;
      let y = node.y !== undefined ? -(node.y - 300) / 25 : 0;
      let z = node.z !== undefined ? node.z : 0;

      // If no 3D coords, arrange in spherical / helical 3D layout
      if (node.x === undefined && node.y === undefined) {
        const phi = Math.acos(-1 + (2 * idx) / nodeCount);
        const theta = Math.sqrt(nodeCount * Math.PI) * phi;
        const radius = Math.min(18, 6 + nodeCount * 1.2);
        x = radius * Math.cos(theta) * Math.sin(phi);
        y = radius * Math.sin(theta) * Math.sin(phi);
        z = radius * Math.cos(phi);
      }

      nodePositions[node.id || idx] = new THREE.Vector3(x, y, z);

      // Node Geometry
      const nodeColor = node.color ? new THREE.Color(node.color) : new THREE.Color(idx % 2 === 0 ? 0x6366f1 : 0x06b6d4);
      const isHighlighted = node.state === 'active' || node.state === 'visited' || node.highlighted;
      const sphereGeo = new THREE.SphereGeometry(1.6, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: isHighlighted ? 0x10b981 : nodeColor,
        emissive: isHighlighted ? 0x059669 : nodeColor,
        emissiveIntensity: isHighlighted ? 1.0 : 0.6,
        metalness: 0.8,
        roughness: 0.2,
        wireframe,
      });

      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(nodePositions[node.id || idx]);
      sphere.userData = { id: node.id || idx, label: node.label || node.id, info: node };
      group.add(sphere);

      // Billboard Text
      const labelText = String(node.label || node.id || `Node ${idx}`);
      const sprite = createTextSprite(labelText, {
        color: '#ffffff',
        borderColor: isHighlighted ? '#10b981' : '#6366f1',
      });
      sprite.position.set(x, y + 2.8, z);
      group.add(sprite);
    });

    // Draw 3D Edges / Tubular Connections
    rawEdges.forEach((edge, edgeIdx) => {
      const fromPos = nodePositions[edge.from || edge.source];
      const toPos = nodePositions[edge.to || edge.target];
      if (!fromPos || !toPos) return;

      // 3D Cylinder Pipe
      const distance = fromPos.distanceTo(toPos);
      const pipeGeo = new THREE.CylinderGeometry(0.12, 0.12, distance, 12);
      const pipeMat = new THREE.MeshStandardMaterial({
        color: edge.highlighted ? 0x10b981 : 0x818cf8,
        emissive: edge.highlighted ? 0x059669 : 0x3730a3,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.85,
        wireframe,
      });

      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      const midPoint = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
      pipe.position.copy(midPoint);
      pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), toPos.clone().sub(fromPos).normalize());
      group.add(pipe);

      // Edge Weight Label if present
      if (edge.weight || edge.label) {
        const edgeSprite = createTextSprite(String(edge.weight || edge.label), {
          fontSize: 26,
          bg: 'rgba(15, 23, 42, 0.9)',
          borderColor: '#38bdf8',
        });
        edgeSprite.scale.set(2.4, 0.8, 1);
        edgeSprite.position.copy(midPoint).add(new THREE.Vector3(0, 1, 0));
        group.add(edgeSprite);
      }

      // Animated energy packet traveling down edge
      const packetGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const packetMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const packet = new THREE.Mesh(packetGeo, packetMat);
      group.add(packet);

      animatedObjectsRef.current.push({
        userData: {
          update: (time) => {
            const speed = 0.8 + (edgeIdx % 3) * 0.3;
            const progress = (time * speed) % 1;
            packet.position.lerpVectors(fromPos, toPos, progress);
          },
        },
      });
    });
  };

  // ── 3D Scene Builder: 3D Hierarchical Tree ─────────────────
  const build3DTree = (group, data) => {
    const nodes = [];
    const links = [];

    // Flatten tree structure
    const traverse = (node, depth = 0, xOffset = 0, zOffset = 0, parentId = null) => {
      if (!node) return;
      const id = node.id || `node_${nodes.length}`;
      const current = {
        id,
        label: node.label || node.val || node.value || id,
        depth,
        x: xOffset,
        y: 16 - depth * 8,
        z: zOffset,
        state: node.state,
      };
      nodes.push(current);

      if (parentId !== null) {
        links.push({ from: parentId, to: id });
      }

      const children = node.children || [];
      if (node.left) children.push(node.left);
      if (node.right) children.push(node.right);

      const spacing = Math.max(3, 14 / Math.pow(1.6, depth));
      const totalWidth = (children.length - 1) * spacing;

      children.forEach((child, i) => {
        const childX = xOffset - totalWidth / 2 + i * spacing;
        const childZ = zOffset + Math.sin(depth + i) * 2;
        traverse(child, depth + 1, childX, childZ, id);
      });
    };

    if (data.root) traverse(data.root);
    else if (data.nodes) return build3DGraph(group, data);

    build3DGraph(group, { nodes, edges: links });
  };

  // ── 3D Scene Builder: 3D Volumetric Array / Tensor ─────────
  const build3DArrayTensor = (group, data) => {
    const values = data.values || [12, 45, 68, 23, 89, 34, 78, 90];
    const is3DMatrix = Array.isArray(values[0]) && Array.isArray(values[0][0]);
    const is2DMatrix = Array.isArray(values[0]) && !is3DMatrix;

    const blockSize = 3.2;
    const spacing = 1.0;

    if (is3DMatrix) {
      // 3D Tensor Voxel Grid
      const dZ = values.length;
      const dY = values[0].length;
      const dX = values[0][0].length;

      values.forEach((plane, z) => {
        plane.forEach((row, y) => {
          row.forEach((val, x) => {
            const posX = (x - dX / 2) * (blockSize + spacing);
            const posY = (y - dY / 2) * (blockSize + spacing);
            const posZ = (z - dZ / 2) * (blockSize + spacing);

            const boxGeo = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
            const boxMat = new THREE.MeshStandardMaterial({
              color: 0x6366f1,
              transparent: true,
              opacity: 0.85,
              metalness: 0.7,
              roughness: 0.2,
              wireframe,
            });
            const box = new THREE.Mesh(boxGeo, boxMat);
            box.position.set(posX, posY, posZ);
            group.add(box);

            const sprite = createTextSprite(String(val), { fontSize: 36, bg: 'rgba(0,0,0,0.7)' });
            sprite.position.set(posX, posY, posZ + blockSize / 2 + 0.1);
            group.add(sprite);
          });
        });
      });
    } else if (is2DMatrix) {
      // 2D Plane elevated in 3D Space
      const rows = values.length;
      const cols = values[0].length;

      values.forEach((row, r) => {
        row.forEach((val, c) => {
          const posX = (c - cols / 2) * (blockSize + spacing);
          const posZ = (r - rows / 2) * (blockSize + spacing);
          const posY = 0;

          const boxGeo = new THREE.BoxGeometry(blockSize, blockSize * 0.6, blockSize);
          const boxMat = new THREE.MeshStandardMaterial({
            color: 0x0ea5e9,
            metalness: 0.8,
            roughness: 0.2,
            wireframe,
          });
          const box = new THREE.Mesh(boxGeo, boxMat);
          box.position.set(posX, posY, posZ);
          group.add(box);

          const sprite = createTextSprite(String(val), { fontSize: 36 });
          sprite.position.set(posX, posY + 2.2, posZ);
          group.add(sprite);
        });
      });
    } else {
      // 1D Linear Array Bar elevated in 3D Space with Heights
      const len = values.length;
      values.forEach((val, idx) => {
        const numVal = typeof val === 'object' ? val.value : Number(val) || 10;
        const height = Math.max(1, Math.min(25, numVal * 0.4));
        const posX = (idx - len / 2) * (blockSize + spacing);
        const posY = height / 2 - 5;
        const posZ = 0;

        const isHighlighted = idx === currentStep || (typeof val === 'object' && val.highlighted);
        const boxGeo = new THREE.BoxGeometry(blockSize, height, blockSize);
        const boxMat = new THREE.MeshStandardMaterial({
          color: isHighlighted ? 0x10b981 : 0x6366f1,
          emissive: isHighlighted ? 0x059669 : 0x312e81,
          emissiveIntensity: isHighlighted ? 1.0 : 0.4,
          metalness: 0.8,
          roughness: 0.2,
          wireframe,
        });
        const bar = new THREE.Mesh(boxGeo, boxMat);
        bar.position.set(posX, posY, posZ);
        group.add(bar);

        // Top value label
        const sprite = createTextSprite(String(typeof val === 'object' ? val.value : val), {
          fontSize: 34,
          borderColor: isHighlighted ? '#10b981' : '#6366f1',
        });
        sprite.position.set(posX, posY + height / 2 + 2, posZ);
        group.add(sprite);

        // Bottom index label
        const indexSprite = createTextSprite(`[${idx}]`, { fontSize: 24, bg: 'transparent', borderColor: 'transparent' });
        indexSprite.position.set(posX, -7, posZ);
        group.add(indexSprite);
      });
    }
  };

  // ── 3D Scene Builder: 3D Multi-Layer Architecture ───────────
  const build3DArchitecture = (group, data) => {
    const layers = data.layers || [
      { name: 'Edge CDN & DNS', color: 0x38bdf8, components: ['Cloudflare Edge', 'WAF Gateway', 'SSL Termination'] },
      { name: 'API Gateway & Ingress', color: 0x818cf8, components: ['Kong Gateway', 'Rate Limiter', 'Auth Guard'] },
      { name: 'Microservices Mesh', color: 0xa855f7, components: ['User Service', 'Order Engine', 'Payment Worker'] },
      { name: 'Distributed Persistence', color: 0x10b981, components: ['Redis Cache', 'Postgres Cluster', 'Kafka Queue'] },
    ];

    const layerSpacing = 8;
    const totalLayers = layers.length;

    layers.forEach((layer, lIdx) => {
      const yPos = (totalLayers / 2 - lIdx) * layerSpacing;

      // Layer base glass slab
      const slabGeo = new THREE.BoxGeometry(32, 0.4, 18);
      const slabMat = new THREE.MeshStandardMaterial({
        color: layer.color || 0x4f46e5,
        transparent: true,
        opacity: 0.35,
        metalness: 0.9,
        roughness: 0.1,
        wireframe,
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, yPos, 0);
      group.add(slab);

      // Layer Title Billboard
      const layerTitle = createTextSprite(layer.name, {
        color: '#ffffff',
        fontSize: 32,
        bg: 'rgba(15, 23, 42, 0.9)',
        borderColor: `#${new THREE.Color(layer.color).getHexString()}`,
      });
      layerTitle.scale.set(6, 1.4, 1);
      layerTitle.position.set(-18, yPos + 1.2, 0);
      group.add(layerTitle);

      // Component blocks on top of slab
      const comps = layer.components || [];
      const compCount = comps.length;
      comps.forEach((compName, cIdx) => {
        const xPos = (cIdx - (compCount - 1) / 2) * 9;
        const blockGeo = new THREE.BoxGeometry(6.5, 2.5, 5);
        const blockMat = new THREE.MeshStandardMaterial({
          color: layer.color || 0x6366f1,
          emissive: layer.color || 0x4338ca,
          emissiveIntensity: 0.6,
          metalness: 0.8,
          roughness: 0.2,
          wireframe,
        });
        const block = new THREE.Mesh(blockGeo, blockMat);
        block.position.set(xPos, yPos + 1.5, 0);
        group.add(block);

        const compLabel = createTextSprite(compName, { fontSize: 26, bg: 'rgba(0,0,0,0.7)' });
        compLabel.position.set(xPos, yPos + 4.2, 0);
        group.add(compLabel);

        // Vertical data stream pipe to next layer
        if (lIdx < totalLayers - 1) {
          const pipeGeo = new THREE.CylinderGeometry(0.15, 0.15, layerSpacing - 2.5, 12);
          const pipeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
          const pipe = new THREE.Mesh(pipeGeo, pipeMat);
          pipe.position.set(xPos, yPos - layerSpacing / 2, 0);
          group.add(pipe);

          // Animated particle
          const packetGeo = new THREE.SphereGeometry(0.3, 16, 16);
          const packetMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
          const packet = new THREE.Mesh(packetGeo, packetMat);
          group.add(packet);

          animatedObjectsRef.current.push({
            userData: {
              update: (time) => {
                const progress = ((time * 0.8 + cIdx * 0.2) % 1);
                packet.position.set(xPos, yPos - 1.25 - progress * (layerSpacing - 2.5), 0);
              },
            },
          });
        }
      });
    });
  };

  // ── 3D Scene Builder: 3D Parametric Math Surface ───────────
  const build3DMathSurface = (group, data) => {
    const size = 30;
    const segments = 45;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = [];
    const colorHelper = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) / 3;
      const v = pos.getZ(i) / 3;
      // Default parametric wave / saddle formula
      const y = Math.sin(u) * Math.cos(v) * 3.5 + Math.sin(Math.sqrt(u * u + v * v)) * 2;
      pos.setY(i, y);

      // Color by height
      const t = (y + 5.5) / 11;
      colorHelper.setHSL(0.6 - t * 0.5, 0.9, 0.5);
      colors.push(colorHelper.r, colorHelper.g, colorHelper.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.5,
      roughness: 0.3,
      side: THREE.DoubleSide,
      wireframe,
    });
    const mesh = new THREE.Mesh(geometry, mat);
    group.add(mesh);

    // Title
    const titleSprite = createTextSprite(data.title || data.equation || 'z = sin(x) · cos(y)', { fontSize: 34 });
    titleSprite.position.set(0, 10, 0);
    group.add(titleSprite);
  };

  // ── 3D Scene Builder: Live Generative Procedural Three.js Code Runner ──
  const executeGenerative3DCode = (group, codeInput) => {
    try {
      const codeString = typeof codeInput === 'string' ? codeInput : (codeInput?.code || codeInput?.threeCode || '');
      if (!codeString || typeof codeString !== 'string') {
        buildDemoScene(group);
        return;
      }

      // Cleanup markdown fences if present
      const cleanCode = codeString
        .replace(/```(?:javascript|js|three)?/gi, '')
        .replace(/```/g, '')
        .trim();

      // Register animation handler helper
      const onAnimate = (fn) => {
        if (typeof fn === 'function') {
          animatedObjectsRef.current.push({
            userData: { update: fn },
          });
        }
      };

      const runFn = new Function(
        'THREE',
        'scene',
        'group',
        'createTextSprite',
        'onAnimate',
        'wireframe',
        'camera',
        'controls',
        `
        try {
          ${cleanCode}
        } catch(err) {
          console.error('Generative 3D script error:', err);
        }
      `
      );

      // Safe scene proxy so that if an AI script calls scene.add(mesh), it redirects to group!
      const sceneProxy = new Proxy(sceneRef.current, {
        get(target, prop) {
          if (prop === 'add') {
            return (...args) => {
              args.forEach((item) => {
                if (item && (item.isLight || item.isCamera)) {
                  target.add(item);
                } else if (item) {
                  group.add(item);
                }
              });
            };
          }
          if (prop === 'background') {
            return target.background;
          }
          return target[prop];
        },
        set(target, prop, value) {
          if (prop === 'background' || prop === 'fog') {
            // Keep user-selected backdrop active and prevent scripts from adding fog
            return true;
          }
          target[prop] = value;
          return true;
        }
      });

      runFn(threeExtended, sceneProxy, group, createTextSprite, onAnimate, wireframe, cameraRef.current, controlsRef.current);

      // Re-apply current background color to scene and ensure no fog
      if (sceneRef.current) {
        const activeColor = new THREE.Color(bgColor);
        sceneRef.current.background = activeColor;
        sceneRef.current.fog = null;
      }
    } catch (err) {
      console.warn('Failed to compile 3D script:', err);
      buildDemoScene(group);
    }
  };

  // ── 3D Scene Builder: Volumetric Elevating Fallback ──────────
  const buildVolumetricFallback = (group, data) => {
    const title = data.title || '3D Spatial Representation';
    const titleSprite = createTextSprite(title, { fontSize: 36 });
    titleSprite.position.set(0, 8, 0);
    group.add(titleSprite);

    const geo = new THREE.TorusKnotGeometry(4.5, 1.2, 100, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x3730a3,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1,
      wireframe,
    });
    const knot = new THREE.Mesh(geo, mat);
    group.add(knot);

    animatedObjectsRef.current.push({
      userData: {
        update: (time) => {
          knot.rotation.x = time * 0.3;
          knot.rotation.y = time * 0.4;
        },
      },
    });
  };

  // ── Production Action: Request Complete Scientific Theory for Active 3D Model ──
  const handleRequest3DTheory = useCallback(() => {
    if (isGenerating) return;
    const { setPendingUserPrompt } = useAppStore.getState();
    const topic = activeConcept || 'this 3D spatial model';
    const codeSnippet = current3DCode ? current3DCode.trim().slice(0, 2500) : '';

    const prompt = `Please provide a thorough scientific theory and step-by-step technical breakdown for "${topic}" based on this exact 3D spatial model:

\`\`\`javascript
${codeSnippet}
\`\`\`

IMPORTANT INSTRUCTIONS:
- Explain in detail using clear technical prose, bullet points, and equations.
- Do NOT output or repeat any 3D scene code, JavaScript code, or Three.js code blocks in your reply. Provide ONLY the scientific theory:
1. Core Theory & Fundamental Governing Scientific/Mathematical Principles
2. 3-Axis Spatial Architecture & Geometric Component Roles
3. Kinematics, Forces & Dynamic Interaction Mechanisms
4. Real-World Applications, Calculations & Mathematical Formulations`;

    setPendingUserPrompt({
      prompt,
      autoSend: true,
    });
  }, [activeConcept, current3DCode, isGenerating]);

  // ── Export High-Resolution 3D PNG ──────────────────────────
  const export3DPNG = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `visual-ai-3d-${visualization?.type || 'diagram'}-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [visualization]);

  // ── Fullscreen Toggle ──────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    const container = wrapperRef.current || mountRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="canvas-container canvas-3d-wrapper"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: bgColor,
        transition: 'background-color 0.2s ease',
      }}
    >
      {/* 3D Model HUD / Status Bar (Top-Left) */}
      <div className="canvas-3d-model-badge">
        <span className="model-status-dot" />
        <span className="model-title">
          {activeConcept ? activeConcept : '3D Spatial Engine'}
        </span>
        <span className="model-sub">
          Interactive 3-Axis
        </span>
      </div>

      {/* Live AI Synthesizing Shimmer Screen */}
      {isGenerating && (
        <div className="canvas-generating-overlay">
          <div className="canvas-generating-card">
            <div className="canvas-orbital-spinner">
              <div className="orbital-ring ring-1" />
              <div className="orbital-ring ring-2" />
              <div className="orbital-ring ring-3" />
              <div className="orbital-core" />
            </div>
            <div className="canvas-generating-header">
              <span className="canvas-generating-tag">
                <span className="generating-pulse-dot" />
                3D SPATIAL ENGINE
              </span>
              <h3 className="canvas-generating-title">Synthesizing 3D Spatial Geometry...</h3>
              <p className="canvas-generating-desc">
                Calculating 3-axis orbital matrices, volumetric meshes & kinematic shaders
              </p>
            </div>
            <div className="canvas-generating-shimmer-track">
              <div className="canvas-generating-shimmer-bar" />
            </div>
            <div className="canvas-generating-status">
              <span className="generating-step-text">Assembling Three.js scene graph...</span>
            </div>
          </div>
        </div>
      )}

      {/* WebGL 3D Canvas Mount Point */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', outline: 'none' }} />

      {/* ── 3D Orientation Gyro Gizmo (Top-Right) ── */}
      <div
        className="gizmo-overlay"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '84px',
          height: '84px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div ref={gizmoMountRef} style={{ width: '80px', height: '80px' }} />
        <span style={{ position: 'absolute', bottom: '4px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', color: '#94a3b8' }}>
          3-AXIS
        </span>
      </div>

      {/* ── 3D Camera & Viewport Control Suite (Horizontal Bottom Dock) ── */}
      <div
        className="canvas-3d-bottom-dock"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Environment Backdrop Selector */}
        <div className="toolbar-menu-wrapper" style={{ position: 'relative' }}>
          <button
            className={`canvas-3d-dock-btn ${showEnvMenu ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowEnvMenu(!showEnvMenu);
              setShowLightingMenu(false);
              setShowViewsMenu(false);
            }}
            data-tooltip="Environment Backdrop"
            aria-label="Change environment background"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 1 10 10c0 2.5-2 4.5-4.5 4.5H16a2 2 0 0 0-2 2c0 1.1-.9 2-2 2a10 10 0 0 1-10-10A10 10 0 0 1 12 2z" />
            </svg>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: bgColor, border: '1.5px solid #ffffff', marginLeft: '2px' }} />
          </button>

          {showEnvMenu && (
            <div
              className="toolbar-popover-menu env-popover-menu"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popover-title">Environment Backdrop</div>
              <div className="env-swatches-grid">
                {[
                  { name: 'OLED Pitch Black', color: '#000000' },
                  { name: 'Deep Space Void', color: '#07090e' },
                  { name: 'Clean Studio Light', color: '#f1f5f9' },
                  { name: 'Blueprint Navy', color: '#0a1628' },
                  { name: 'Industrial Slate', color: '#1e293b' },
                  { name: 'Cyberpunk Violet', color: '#13091f' },
                  { name: 'Deep Emerald', color: '#061a14' },
                ].map((swatch) => (
                  <button
                    key={swatch.color}
                    type="button"
                    className={`env-swatch-btn ${bgColor === swatch.color ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setBgColor(swatch.color);
                      setShowEnvMenu(false);
                    }}
                    style={{ background: swatch.color }}
                    title={swatch.name}
                  />
                ))}
              </div>
              <div className="env-custom-row">
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Custom:</span>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => {
                    e.stopPropagation();
                    setBgColor(e.target.value);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="env-color-input"
                />
              </div>
            </div>
          )}
        </div>

        {/* Lighting Mode Selector */}
        <div className="toolbar-menu-wrapper" style={{ position: 'relative' }}>
          <button
            className={`canvas-3d-dock-btn ${showLightingMenu ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowLightingMenu(!showLightingMenu);
              setShowEnvMenu(false);
              setShowViewsMenu(false);
            }}
            data-tooltip={`Lighting: ${lightingMode.toUpperCase()}`}
            aria-label="Change lighting preset"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <span style={{ fontSize: '10px', fontWeight: 700, marginLeft: '2px' }}>{lightingMode.toUpperCase()}</span>
          </button>

          {showLightingMenu && (
            <div
              className="toolbar-popover-menu lighting-popover-menu"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popover-title">Studio Lighting Mood</div>
              {[
                { id: 'studio', label: 'Studio 3-Point Light' },
                { id: 'cyber', label: 'Cyberpunk Neon Glow' },
                { id: 'sunlight', label: 'High-Contrast Sunlight' },
                { id: 'soft', label: 'Soft Diffuse Ambient' },
              ].map((light) => (
                <button
                  key={light.id}
                  type="button"
                  className={`popover-option-btn ${lightingMode === light.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLightingMode(light.id);
                    setShowLightingMenu(false);
                  }}
                >
                  <span>{light.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-separator" />

        {/* Camera Angle Presets */}
        <div className="toolbar-menu-wrapper" style={{ position: 'relative' }}>
          <button
            className={`canvas-3d-dock-btn ${showViewsMenu ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowViewsMenu(!showViewsMenu);
              setShowEnvMenu(false);
              setShowLightingMenu(false);
            }}
            data-tooltip={`Camera Angle: ${activePreset.toUpperCase()}`}
            aria-label="Select camera view"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span style={{ fontSize: '10px', fontWeight: 700, marginLeft: '2px' }}>{activePreset.toUpperCase()}</span>
          </button>

          {showViewsMenu && (
            <div
              className="toolbar-popover-menu views-popover-menu"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popover-title">Camera Angles</div>
              {[
                { id: 'iso', label: 'Isometric 3D' },
                { id: 'top', label: 'Top View (XY)' },
                { id: 'front', label: 'Front View (XZ)' },
                { id: 'side', label: 'Right Side (YZ)' },
                { id: 'bottom', label: 'Bottom View (-XY)' },
                { id: 'perspective', label: 'Perspective Normal' },
              ].map((view) => (
                <button
                  key={view.id}
                  type="button"
                  className={`popover-option-btn ${activePreset === view.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCameraPreset(view.id);
                    setShowViewsMenu(false);
                  }}
                >
                  <span>{view.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center / Focus All Bounds */}
        <button
          className="canvas-3d-dock-btn"
          onClick={() => fitCameraToBounds(contentGroupRef.current)}
          data-tooltip="Recenter & Fit 3D Model"
          aria-label="Recenter model"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </button>

        <div className="toolbar-separator" />

        {/* Kinematics Play / Pause Toggle */}
        <button
          className={`canvas-3d-dock-btn ${!isPaused ? 'active' : ''}`}
          onClick={() => setIsPaused(!isPaused)}
          data-tooltip={isPaused ? 'Resume Kinematics Animation' : 'Pause Animation'}
          aria-label="Toggle animation"
        >
          {isPaused ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          )}
        </button>

        {/* Kinematic Speed Multiplier */}
        <button
          className="canvas-3d-dock-btn"
          onClick={() => {
            const nextSpeed = animSpeed === 1 ? 2 : animSpeed === 2 ? 0.5 : 1;
            setAnimSpeed(nextSpeed);
          }}
          data-tooltip={`Animation Speed: ${animSpeed}x (Click to cycle)`}
          aria-label="Cycle animation speed"
          style={{ fontSize: '11px', fontWeight: 700 }}
        >
          {animSpeed}x
        </button>

        {/* Auto Rotate Toggle */}
        <button
          className={`canvas-3d-dock-btn ${autoRotate ? 'active' : ''}`}
          onClick={() => setAutoRotate(!autoRotate)}
          data-tooltip={autoRotate ? 'Stop 3-Axis Auto-Rotation' : 'Auto-Rotate (3-Axis)'}
          aria-label="Toggle auto rotation"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </button>

        {/* Wireframe Toggle */}
        <button
          className={`canvas-3d-dock-btn ${wireframe ? 'active' : ''}`}
          onClick={() => setWireframe(!wireframe)}
          data-tooltip={wireframe ? 'Shaded Mesh' : 'Wireframe Mode'}
          aria-label="Toggle wireframe"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        </button>

        {/* Label Annotations Toggle */}
        <button
          className={`canvas-3d-dock-btn ${showLabels ? 'active' : ''}`}
          onClick={() => setShowLabels(!showLabels)}
          data-tooltip={showLabels ? 'Hide Text Labels' : 'Show Text Labels'}
          aria-label="Toggle text labels"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        </button>

        {/* Grid Floor Toggle */}
        <button
          className={`canvas-3d-dock-btn ${showGrid ? 'active' : ''}`}
          onClick={() => setShowGrid(!showGrid)}
          data-tooltip={showGrid ? 'Hide Grid Floor' : 'Show Grid Floor'}
          aria-label="Toggle grid"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="12" y1="2" x2="12" y2="22" />
            <path d="M20 20L4 4" />
          </svg>
        </button>

        <div className="toolbar-separator" />

        {/* Theory Generator for Active 3D Model */}
        <button
          className="canvas-3d-dock-btn theory-3d-dock-btn"
          onClick={handleRequest3DTheory}
          data-tooltip="Generate in-depth scientific theory for this 3D model"
          aria-label="Generate Theory"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.28), rgba(168, 85, 247, 0.28))',
            border: '1px solid rgba(168, 85, 247, 0.6)',
            color: '#c084fc',
            fontWeight: 700,
            gap: '6px',
            padding: '0 12px',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.35)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>Theory</span>
        </button>

        <div className="toolbar-separator" />

        {/* Export 3D Snapshot */}
        <button
          className="canvas-3d-dock-btn"
          onClick={export3DPNG}
          data-tooltip="Export 3D Snapshot (PNG)"
          aria-label="Export PNG"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>

        {/* Fullscreen */}
        <button
          className="canvas-3d-dock-btn"
          onClick={toggleFullscreen}
          data-tooltip="Fullscreen"
          aria-label="Toggle fullscreen"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>

      {/* 3D HUD & Memory Info */}
      <StateHUD />

      {/* Step HUD */}
      {steps.length > 0 && currentStep >= 0 && steps[currentStep] && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          padding: '8px 14px',
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(16px)',
          borderRadius: '10px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          fontSize: '13px',
          color: '#ffffff',
          maxWidth: '380px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          zIndex: 10,
        }}>
          <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
            3D Step State
          </div>
          {steps[currentStep].description || `Step ${currentStep + 1}`}
        </div>
      )}
    </div>
  );
}
