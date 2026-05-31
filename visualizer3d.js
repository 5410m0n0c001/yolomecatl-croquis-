/**
 * visualizer3d.js
 * Módulo de visualización tridimensional (3D) para Salón Yolomecatl con Three.js.
 * Convierte las coordenadas del plano SVG 2D (10 unidades = 1 metro) en 3D (X, Z) con elevación Y.
 * Genera el entorno arquitectónico completo y el mobiliario interactivo en tiempo real.
 */

let scene, camera, renderer, controls;
let container = null;
let active3dElements = {}; // Guardar referencias de grupos de mesas { number: Group }
let staticEnvironmentGroup = null; // Grupo para las estructuras estáticas
let currentTablesData = {};
let currentLayout = 'A';
let activeSelectedTableNum = null;
let animationFrameId = null;
let selectionRing = null;

// Referencias para actualización dinámica
let danceFloorMesh = null;
let danceFloorBorderMesh = null;
let spotPista = null;

// Referencias para flujos y circulación 3D
let path3DGroups = {
  guest: null,
  service: null,
  emergency: null
};
let flowParticles = [];

// Esquema de Colores Premium (Primavera Events)
const COLORS = {
  bgNight: 0x020b14,        // Cielo azul noche profundo
  floorSalon: 0xeae5df,     // Mármol beige pulido satinado
  floorDance: 0x5c3a21,     // Parquet madera de pista
  wallsSalon: 0x0b253b,     // Muros azul medianoche
  columns: 0x1a3246,        // Columnas estuco
  grass: 0x112718,          // Pasto oscuro denso
  water: 0x13394d,          // Agua alberca cristalina
  waterfallWall: 0x1e293b,  // Piedra volcánica basalto mojada
  woodDark: 0x3e2723,       // Madera de nogal barra/vigas
  tileRoof: 0xa16247,       // Teja de arcilla rústica (capilla/techo)
  stonePillars: 0x6b7280,   // Cantera capilla
  gold: 0xd4af37,           // Acento dorado (VIP/Selección)
  roseCoral: 0xF05A7E,      // Acento coral marca
  reservedRed: 0xef4444,    // Reservado
  chairSeat: 0x071b2d,      // Silla Tiffany tela
  chairGoldFrame: 0xbda068, // Estructura dorada de la silla
  whiteCloth: 0xfafafa,     // Mantel estándar blanco
  asphalt: 0x111827         // Estacionamiento gris asfalto
};

// Configuración de Cotas y Posiciones del Salón
const SALON = {
  xMin: 27.0, xMax: 75.0, w: 48.0,
  zMin: 8.0,  zMax: 70.0, h: 62.0,
  height: 6.5,
  roofRidge: 8.2
};

/**
 * Inicializa el motor 3D
 */
export function init3D(containerElement, tablesData, layout, selectedTableNum) {
  container = containerElement;
  currentTablesData = tablesData;
  currentLayout = layout;
  activeSelectedTableNum = selectedTableNum;
  
  // Limpiar el contenedor por seguridad
  container.innerHTML = "";
  
  // 1. Crear Escena
  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.bgNight);
  scene.fog = new THREE.FogExp2(COLORS.bgNight, 0.012); // Niebla sutil para profundidad nocturna
  
  // 2. Configurar Cámara (Perspectiva de gran angular oblicua)
  camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 300);
  camera.position.set(50, 55, 115); // Posicionada atrás y arriba para encuadrar todo el terreno
  
  // 3. Crear Renderer WebGL con antialias
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35; // Aumentado de 0.95 a 1.35 para aclarar la escena a petición del usuario
  container.appendChild(renderer.domElement);
  
  // 4. Orbit Controls (Navegación fluida)
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 10;
  controls.maxDistance = 150;
  controls.maxPolarAngle = Math.PI / 2 - 0.03; // Evita ver por debajo del piso
  controls.target.set(50, 2, 49); // Apuntando al centro de la propiedad (100x98m)
  controls.update();
  
  // 5. Configurar Iluminación de Gala
  setupLighting();
  
  // 6. Levantar Estructuras Estáticas (El Salón y Exteriores)
  buildEnvironment();
  
  // 7. Crear el Aro de Selección animado
  createSelectionRing();
  
  // 8. Renderizar Mobiliario Dinámico (Mesas y Sillas)
  syncWithData(tablesData, layout, selectedTableNum);
  
  // 9. Bucle de Animación
  animate();
  
  // Escuchar redimensionamiento del visor
  window.addEventListener("resize", resize3D);
}

/**
 * Detiene la animación y libera la memoria de WebGL
 */
export function destroy3D() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener("resize", resize3D);
  
  if (controls) controls.dispose();
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }
  
  scene = null;
  camera = null;
  renderer = null;
  controls = null;
  active3dElements = {};
  staticEnvironmentGroup = null;
  selectionRing = null;
  
  // Limpiar grupos de flujos 3D
  const types = ['guest', 'service', 'emergency'];
  types.forEach(type => {
    path3DGroups[type] = null;
  });
  flowParticles = [];
}

/**
 * Redimensiona el canvas WebGL al tamaño del contenedor
 */
export function resize3D() {
  if (!container || !camera || !renderer) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Restaura la cámara al encuadre oblicuo por defecto
 */
export function resetCamera3D() {
  if (!camera || !controls) return;
  
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = new THREE.Vector3(50, 55, 115);
  const endTarget = new THREE.Vector3(50, 2, 49);
  
  let t = 0;
  function transition() {
    t += 0.04;
    if (t <= 1) {
      camera.position.lerpVectors(startPos, endPos, t);
      controls.target.lerpVectors(startTarget, endTarget, t);
      controls.update();
      requestAnimationFrame(transition);
    } else {
      camera.position.copy(endPos);
      controls.target.copy(endTarget);
      controls.update();
    }
  }
  transition();
}

/**
 * Configuración lumínica nocturna
 */
function setupLighting() {
  // A) Luz Ambiental (Soft azul brillante nocturno)
  // Aumentado a 0.65 e iluminando con un tono más claro/neutral para mayor visibilidad a petición del usuario
  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);
  
  // B) Luz Lunar / Sol Direccional (Tono azul plata oblicuo intenso)
  // Aumentado de 0.5 a 1.25 para mayor claridad de detalles y sombras
  const moonLightObj = new THREE.DirectionalLight(0xdbeafe, 1.25);
  moonLightObj.position.set(40, 80, 20);
  moonLightObj.castShadow = true;
  moonLightObj.shadow.mapSize.width = 2048;
  moonLightObj.shadow.mapSize.height = 2048;
  moonLightObj.shadow.camera.near = 10;
  moonLightObj.shadow.camera.far = 200;
  
  // Cubrir el terreno completo de 100m x 98m
  const d = 60;
  moonLightObj.shadow.camera.left = -d;
  moonLightObj.shadow.camera.right = d;
  moonLightObj.shadow.camera.top = d;
  moonLightObj.shadow.camera.bottom = -d;
  moonLightObj.shadow.bias = -0.0003;
  scene.add(moonLightObj);
  
  // C) Iluminación de Acento en Pista de Baile (Foco de color Coral de marca)
  // Guardamos la referencia en spotPista para moverla dinámicamente según el Layout (A vs B)
  spotPista = new THREE.SpotLight(COLORS.roseCoral, 4.5, 35, Math.PI / 4, 0.5, 1.2);
  spotPista.position.set(48.5, 12.0, 21.5); // Posicionada más arriba para iluminar mejor
  spotPista.target.position.set(48.5, 0, 21.5);
  spotPista.castShadow = true;
  spotPista.shadow.mapSize.width = 1024;
  spotPista.shadow.mapSize.height = 1024;
  scene.add(spotPista);
  scene.add(spotPista.target);
}

/**
 * Levanta toda la arquitectura estática basada en el Manual Técnico
 */
function buildEnvironment() {
  staticEnvironmentGroup = new THREE.Group();
  scene.add(staticEnvironmentGroup);
  
  // --- A) SUELO BASE Y TERRENOS ---
  // Terreno total 100m x 98m
  const groundGeom = new THREE.BoxGeometry(100, 0.2, 98);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x03182b, roughness: 0.95 }); // Slate base
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.position.set(50, -0.1, 49);
  ground.receiveShadow = true;
  staticEnvironmentGroup.add(ground);
  
  // Cuadrícula técnica decorativa sutil
  const gridHelper = new THREE.GridHelper(100, 50, 0x1f3b5c, 0x0f253d);
  gridHelper.position.set(50, 0.01, 49);
  gridHelper.material.opacity = 0.18;
  gridHelper.material.transparent = true;
  staticEnvironmentGroup.add(gridHelper);
  
  // Áreas de Jardín
  // Jardín Principal (Extremo izquierdo: X: 2 a 25, Y: 2 a 94)
  const gardenGeom = new THREE.BoxGeometry(23, 0.02, 92);
  const gardenMat = new THREE.MeshStandardMaterial({ color: COLORS.grass, roughness: 0.9 });
  const gardenLeft = new THREE.Mesh(gardenGeom, gardenMat);
  gardenLeft.position.set(13.5, 0.01, 48);
  gardenLeft.receiveShadow = true;
  staticEnvironmentGroup.add(gardenLeft);
  
  // Sendero de piedra en jardín izquierdo
  const pathGeom = new THREE.BoxGeometry(4.0, 0.005, 70);
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x27353f, roughness: 0.9 });
  const pathStone = new THREE.Mesh(pathGeom, pathMat);
  pathStone.position.set(13.0, 0.02, 42.0);
  pathStone.receiveShadow = true;
  staticEnvironmentGroup.add(pathStone);
  
  // Jardín 2 (Atrás de la Recepción: X: 27 a 75, Y: 78.5 a 94)
  const garden2Geom = new THREE.BoxGeometry(48, 0.02, 15.5);
  const garden2 = new THREE.Mesh(garden2Geom, gardenMat);
  garden2.position.set(51, 0.01, 86.25);
  garden2.receiveShadow = true;
  staticEnvironmentGroup.add(garden2);
  
  // --- B) PLATAFORMA ELEVADA Y PISO INTERIOR DEL SALÓN ---
  const floorSalonGeom = new THREE.BoxGeometry(SALON.w, 0.05, SALON.h);
  const floorSalonMat = new THREE.MeshStandardMaterial({ color: COLORS.floorSalon, roughness: 0.35, metalness: 0.1 });
  const floorSalon = new THREE.Mesh(floorSalonGeom, floorSalonMat);
  floorSalon.position.set(51.0, 0.025, 39.0);
  floorSalon.receiveShadow = true;
  staticEnvironmentGroup.add(floorSalon);
  
  // Inicialización de la Pista de Baile Dinámica (Brillante y pulida de color café)
  // Usamos un roughness ultra bajo (0.08) y metalness moderado (0.35) para que brille y refleje de forma premium
  const danceMat = new THREE.MeshStandardMaterial({ 
    color: COLORS.floorDance, 
    roughness: 0.08, 
    metalness: 0.35 
  });
  danceFloorMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), danceMat);
  danceFloorMesh.receiveShadow = true;
  staticEnvironmentGroup.add(danceFloorMesh);
  
  // Borde dorado metálico de la pista
  const danceBorderMat = new THREE.MeshStandardMaterial({ 
    color: COLORS.gold, 
    roughness: 0.1, 
    metalness: 0.9 
  });
  danceFloorBorderMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), danceBorderMat);
  staticEnvironmentGroup.add(danceFloorBorderMesh);
  
  // --- C) MUROS PERIMETRALES Y COLUMNAS ---
  const wallMat = new THREE.MeshStandardMaterial({ color: COLORS.wallsSalon, roughness: 0.85 });
  const colMat = new THREE.MeshStandardMaterial({ color: COLORS.columns, roughness: 0.6 });
  
  // 8 Columnas estructurales (Muros laterales izquierdo/derecho del salón)
  // X = 27 (izq) y X = 75 (der). Z = 19.5, 31.5, 43.5, 55.5
  const colGeom = new THREE.BoxGeometry(0.5, SALON.height, 0.75);
  const colZs = [19.5, 31.5, 43.5, 55.5];
  colZs.forEach(z => {
    // Izquierda
    const cL = new THREE.Mesh(colGeom, colMat);
    cL.position.set(27.0, SALON.height / 2, z);
    cL.castShadow = true;
    cL.receiveShadow = true;
    staticEnvironmentGroup.add(cL);
    
    // Derecha
    const cR = new THREE.Mesh(colGeom, colMat);
    cR.position.set(75.0, SALON.height / 2, z);
    cR.castShadow = true;
    cR.receiveShadow = true;
    staticEnvironmentGroup.add(cR);
    
    // Luces de Acento en Columnas (Pink Coral Uplights)
    const uplightL = new THREE.PointLight(COLORS.roseCoral, 0.8, 6.0, 1.5);
    uplightL.position.set(27.4, 0.2, z);
    staticEnvironmentGroup.add(uplightL);
    
    const uplightR = new THREE.PointLight(COLORS.roseCoral, 0.8, 6.0, 1.5);
    uplightR.position.set(74.6, 0.2, z);
    staticEnvironmentGroup.add(uplightR);
  });
  
  // Muros perimetrales (Cajas simples de doble altura)
  // Muro izquierdo - Reemplazado por una elegante Arcada Colonial abierta con arcos de vistas al jardín principal
  const buildArcadeSegment = (zStart, zEnd) => {
    const zLength = zEnd - zStart;
    const zCenter = zStart + zLength / 2;
    
    // 1. Antepecho base (muro bajo colonial)
    const baseGeom = new THREE.BoxGeometry(0.3, 0.9, zLength);
    const baseMesh = new THREE.Mesh(baseGeom, wallMat);
    baseMesh.position.set(27.0, 0.45, zCenter);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    staticEnvironmentGroup.add(baseMesh);
    
    // 2. Dintel superior de carga
    const topGeom = new THREE.BoxGeometry(0.3, 1.7, zLength);
    const topMesh = new THREE.Mesh(topGeom, wallMat);
    topMesh.position.set(27.0, 6.5 - 0.85, zCenter);
    topMesh.castShadow = true;
    staticEnvironmentGroup.add(topMesh);
    
    // 3. Pilares laterales de cantera que enmarcan la apertura
    const pilarW = 0.6;
    const pilarGeom = new THREE.BoxGeometry(0.3, 3.9, pilarW);
    
    const pilarL = new THREE.Mesh(pilarGeom, wallMat);
    pilarL.position.set(27.0, 0.9 + 1.95, zStart + pilarW/2);
    pilarL.castShadow = true;
    staticEnvironmentGroup.add(pilarL);
    
    const pilarR = new THREE.Mesh(pilarGeom, wallMat);
    pilarR.position.set(27.0, 0.9 + 1.95, zEnd - pilarW/2);
    pilarR.castShadow = true;
    staticEnvironmentGroup.add(pilarR);
    
    // 4. Esquinas arqueadas a 45 grados para conformar el dintel colonial arqueado
    const cornerGeom = new THREE.BoxGeometry(0.32, 0.6, 0.6);
    const cornerMat = new THREE.MeshStandardMaterial({ color: COLORS.columns, roughness: 0.7 });
    
    const cL = new THREE.Mesh(cornerGeom, cornerMat);
    cL.position.set(27.0, 4.8 - 0.3, zStart + pilarW + 0.3);
    cL.rotation.x = Math.PI / 4;
    staticEnvironmentGroup.add(cL);
    
    const cR = new THREE.Mesh(cornerGeom, cornerMat);
    cR.position.set(27.0, 4.8 - 0.3, zEnd - pilarW - 0.3);
    cR.rotation.x = -Math.PI / 4;
    staticEnvironmentGroup.add(cR);
  };

  // Construir las 5 arcadas a lo largo de todo el lateral izquierdo que conecta al jardín
  buildArcadeSegment(8.0, 19.5);
  buildArcadeSegment(19.5, 31.5);
  buildArcadeSegment(31.5, 43.5);
  buildArcadeSegment(43.5, 55.5);
  buildArcadeSegment(55.5, 70.0);
  
  // Muro derecho
  const wallRightGeom = new THREE.BoxGeometry(0.3, SALON.height, SALON.h);
  const wallRight = new THREE.Mesh(wallRightGeom, wallMat);
  wallRight.position.set(75.0, SALON.height / 2, 39.0);
  wallRight.castShadow = true;
  staticEnvironmentGroup.add(wallRight);
  
  // Muro trasero (Norte) - exceptuando zona de conexión con el DJ central
  const wallBackLGeom = new THREE.BoxGeometry(11.5, SALON.height, 0.3);
  const wallBackL = new THREE.Mesh(wallBackLGeom, wallMat);
  wallBackL.position.set(32.75, SALON.height / 2, 8.0);
  wallBackL.castShadow = true;
  staticEnvironmentGroup.add(wallBackL);
  
  const wallBackRGeom = new THREE.BoxGeometry(16.5, SALON.height, 0.3);
  const wallBackR = new THREE.Mesh(wallBackRGeom, wallMat);
  wallBackR.position.set(66.75, SALON.height / 2, 8.0);
  wallBackR.castShadow = true;
  staticEnvironmentGroup.add(wallBackR);
  
  // Muro frontal (Lobby - Sur)
  const wallFrontLGeom = new THREE.BoxGeometry(20.0, SALON.height, 0.3);
  const wallFrontL = new THREE.Mesh(wallFrontLGeom, wallMat);
  wallFrontL.position.set(37.0, SALON.height / 2, 70.0);
  wallFrontL.castShadow = true;
  staticEnvironmentGroup.add(wallFrontL);
  
  const wallFrontRGeom = new THREE.BoxGeometry(20.0, SALON.height, 0.3);
  const wallFrontR = new THREE.Mesh(wallFrontRGeom, wallMat);
  wallFrontR.position.set(65.0, SALON.height / 2, 70.0);
  wallFrontR.castShadow = true;
  staticEnvironmentGroup.add(wallFrontR);
  
  // --- D) ARMADURA DE TECHO (A DOS AGUAS) ---
  const roofGroup = new THREE.Group();
  staticEnvironmentGroup.add(roofGroup);
  
  // Vigas de madera rústica longitudinales
  const beamMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.8 });
  const beamGeom = new THREE.BoxGeometry(SALON.w, 0.15, 0.15);
  for (let z = 8.0; z <= 70.0; z += 10.0) {
    // Viga izquierda inclinada
    const beamL = new THREE.Mesh(beamGeom, beamMat);
    beamL.position.set(51.0 - 12.0, 6.5 + (8.2 - 6.5)/2, z);
    beamL.rotation.z = Math.atan2((8.2 - 6.5), 24.0);
    roofGroup.add(beamL);
    
    // Viga derecha inclinada
    const beamR = new THREE.Mesh(beamGeom, beamMat);
    beamR.position.set(51.0 + 12.0, 6.5 + (8.2 - 6.5)/2, z);
    beamR.rotation.z = -Math.atan2((8.2 - 6.5), 24.0);
    roofGroup.add(beamR);
  }
  
  // Candelabros colgantes premium (6 candelabros espaciados uniformemente)
  const bulbGeom = new THREE.SphereGeometry(0.18, 12, 12);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let z = 13.0; z < 70.0; z += 10.0) {
    const chainGeom = new THREE.CylinderGeometry(0.015, 0.015, 2.0, 8);
    const chainMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9 });
    const chain = new THREE.Mesh(chainGeom, chainMat);
    chain.position.set(51.0, 8.2 - 1.0, z);
    staticEnvironmentGroup.add(chain);
    
    const chandelier = new THREE.Mesh(bulbGeom, bulbMat);
    chandelier.position.set(51.0, 8.2 - 2.0, z);
    staticEnvironmentGroup.add(chandelier);
    
    const chandelierLight = new THREE.PointLight(0xfff3e0, 0.65, 12, 2.0);
    chandelierLight.position.set(51.0, 8.2 - 2.1, z);
    staticEnvironmentGroup.add(chandelierLight);
  }
  
  // --- E) ESCENARIO DJ CON BAÑOS SUBTERRÁNEOS Y ESCALERAS LATERALES DESCENDENTES ---
  const stageGroup = new THREE.Group();
  stageGroup.name = "stage-and-sub-bathrooms";
  stageGroup.position.set(48.5, 0, 11.0); // Centrado en (48.5, 11)
  
  // Materiales de alta fidelidad
  const stageMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.5 });
  const wcSubWallMat = new THREE.MeshStandardMaterial({ color: 0x081d2f, roughness: 0.85 });
  const stairsMat = new THREE.MeshStandardMaterial({ color: COLORS.columns, roughness: 0.7 });
  const doorSubMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.6 }); // Puertas rústicas de nogal
  
  // 1. Plataforma del Escenario (Sólida, elevación Y = 0 a 1.0m)
  const stageBaseGeom = new THREE.BoxGeometry(20.0, 1.0, 6.0);
  const stageBase = new THREE.Mesh(stageBaseGeom, stageMat);
  stageBase.position.y = 0.5; // Centro del bloque a 0.5m, tope a 1.0m
  stageBase.castShadow = true;
  stageBase.receiveShadow = true;
  stageGroup.add(stageBase);
  
  // 2. Baños Subterráneos (Ubicados en el espacio inferior excavado de Y = -1.8m a 0.0m)
  const wcFloor = new THREE.Mesh(new THREE.BoxGeometry(20.0, 0.05, 6.0), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2 }));
  wcFloor.position.set(0, -1.8, 0);
  wcFloor.receiveShadow = true;
  stageGroup.add(wcFloor);
  
  // Muros de contención del sótano (Norte, Oeste, Este)
  const wallNorthSub = new THREE.Mesh(new THREE.BoxGeometry(20.0, 1.8, 0.2), wcSubWallMat);
  wallNorthSub.position.set(0, -0.9, -3.0);
  wallNorthSub.castShadow = true;
  stageGroup.add(wallNorthSub);
  
  const wallWestSub = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 6.0), wcSubWallMat);
  wallWestSub.position.set(-10.0, -0.9, 0.0);
  wallWestSub.castShadow = true;
  stageGroup.add(wallWestSub);
  
  const wallEastSub = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 6.0), wcSubWallMat);
  wallEastSub.position.set(10.0, -0.9, 0.0);
  wallEastSub.castShadow = true;
  stageGroup.add(wallEastSub);
  
  // Muro frontal sur de los baños con las puertas de Damas y Caballeros
  // Ancho total 20m. Dejamos claro de puerta de Damas en X = -5.0 y Caballeros en X = +5.0
  const wallSouthSubL = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.8, 0.2), wcSubWallMat);
  wallSouthSubL.position.set(-6.5, -0.9, 3.0);
  wallSouthSubL.castShadow = true;
  stageGroup.add(wallSouthSubL);
  
  const wallSouthSubM = new THREE.Mesh(new THREE.BoxGeometry(6.0, 1.8, 0.2), wcSubWallMat);
  wallSouthSubM.position.set(0.0, -0.9, 3.0);
  wallSouthSubM.castShadow = true;
  stageGroup.add(wallSouthSubM);
  
  const wallSouthSubR = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.8, 0.2), wcSubWallMat);
  wallSouthSubR.position.set(6.5, -0.9, 3.0);
  wallSouthSubR.castShadow = true;
  stageGroup.add(wallSouthSubR);
  
  // Puertas de nogal para el ingreso a los baños subterráneos (WC Damas / Caballeros)
  const wcDoorGeom = new THREE.BoxGeometry(1.2, 1.7, 0.05);
  const wcDoorL = new THREE.Mesh(wcDoorGeom, doorSubMat);
  wcDoorL.position.set(-3.0, -0.95, 3.0);
  stageGroup.add(wcDoorL);
  
  const wcDoorR = new THREE.Mesh(wcDoorGeom, doorSubMat);
  wcDoorR.position.set(3.0, -0.95, 3.0);
  stageGroup.add(wcDoorR);
  
  // Molduras e indicadores luminosos discretos "WC"
  const signGeom = new THREE.BoxGeometry(0.4, 0.2, 0.02);
  const signD = new THREE.Mesh(signGeom, new THREE.MeshBasicMaterial({ color: 0xF05A7E }));
  signD.position.set(-3.0, -0.05, 3.01);
  stageGroup.add(signD);
  
  const signC = new THREE.Mesh(signGeom, new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
  signC.position.set(3.0, -0.05, 3.01);
  stageGroup.add(signC);
  
  // 3. Escaleras Laterales que bajan a los sanitarios (a ambos lados del escenario)
  // Vanos de escaleras: Ancho 3.5m, Largo 6.0m. Descienden de Y = 0.0m a Y = -1.8m
  const numSteps = 9;
  const stepDepth = 6.0 / numSteps;
  const stepHeight = 1.8 / numSteps;
  
  // Generar peldaños de la Escalera Izquierda (desciende hacia el norte)
  for (let i = 0; i < numSteps; i++) {
    const stepGeom = new THREE.BoxGeometry(3.5, 0.15, stepDepth);
    const zPos = 3.0 - (i * stepDepth) - (stepDepth / 2);
    const yPos = -((i + 1) * stepHeight);
    
    const stepL = new THREE.Mesh(stepGeom, stairsMat);
    stepL.position.set(-11.75, yPos, zPos);
    stepL.castShadow = true;
    stepL.receiveShadow = true;
    stageGroup.add(stepL);
    
    // Escalera Derecha (Espejo)
    const stepR = new THREE.Mesh(stepGeom, stairsMat);
    stepR.position.set(11.75, yPos, zPos);
    stepR.castShadow = true;
    stepR.receiveShadow = true;
    stageGroup.add(stepR);
  }
  
  // Pretiles/Barandillas de protección lateral a nivel de piso (Y = 0.0 a 1.0m)
  // Evitan caídas al hueco de la escalera desde el salón
  const railingGeom = new THREE.BoxGeometry(0.15, 1.0, 6.0);
  
  // Pretil exterior Izquierdo (X = -13.5)
  const railingL1 = new THREE.Mesh(railingGeom, stairsMat);
  railingL1.position.set(-13.5, 0.5, 0);
  railingL1.castShadow = true;
  stageGroup.add(railingL1);
  
  // Pretil exterior Derecho (X = 13.5)
  const railingR1 = new THREE.Mesh(railingGeom, stairsMat);
  railingR1.position.set(13.5, 0.5, 0);
  railingR1.castShadow = true;
  stageGroup.add(railingR1);
  
  // 4. Consola de DJ (Tope del Stage, Y = 1.0m)
  const djConsoleGeom = new THREE.BoxGeometry(4.0, 1.0, 1.2);
  const djConsoleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
  const djConsole = new THREE.Mesh(djConsoleGeom, djConsoleMat);
  djConsole.position.set(0, 1.0 + 0.5, -1.8);
  djConsole.castShadow = true;
  stageGroup.add(djConsole);
  
  // Altavoces de Gala
  const spkGeom = new THREE.BoxGeometry(0.7, 1.8, 0.7);
  const spkMat = new THREE.MeshStandardMaterial({ color: 0x070b12, roughness: 0.95 });
  
  const spkL = new THREE.Mesh(spkGeom, spkMat);
  spkL.position.set(-8.5, 1.0 + 0.9, 1.5);
  spkL.castShadow = true;
  stageGroup.add(spkL);
  
  const spkR = new THREE.Mesh(spkGeom, spkMat);
  spkR.position.set(8.5, 1.0 + 0.9, 1.5);
  spkR.castShadow = true;
  stageGroup.add(spkR);
  
  // Rampa/Acceso técnico desde el pasillo de la barra al Stage en el lateral derecho posterior
  // Conecta el pasillo (X = 27.0 en base, o local X = +10) con la plataforma
  const stageRampGeom = new THREE.BoxGeometry(1.5, 0.5, 1.2);
  const stageRamp = new THREE.Mesh(stageRampGeom, stageMat);
  stageRamp.position.set(10.75, 0.75, -2.4); // Justo en el lateral trasero que da al pasillo de la barra
  stageRamp.rotation.y = 0;
  stageGroup.add(stageRamp);
  
  staticEnvironmentGroup.add(stageGroup);
  
  // --- F) COCINA Y BARRA DE EVENTOS DE ALTO DETALLE ---
  // Muros de cocina (X: 77 a 98, Z: 2 a 25)
  // --- F) COCINA Y BARRA DE EVENTOS DE ALTO DETALLE ---
  // Muros de cocina (X: 77 a 98, Z: 2 a 25)
  const kitchenGroup = new THREE.Group();
  kitchenGroup.name = "kitchen-industrial-structure";
  kitchenGroup.position.set(87.5, 0, 13.5); // Centro de la cocina
  
  const kWallMat = new THREE.MeshStandardMaterial({ color: 0x092135, roughness: 0.85 });
  
  // 1. Piso de loseta comercial en la cocina
  const kFloorGeom = new THREE.BoxGeometry(21.0, 0.05, 23.0);
  const kFloorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25 });
  const kFloor = new THREE.Mesh(kFloorGeom, kFloorMat);
  kFloor.position.y = 0.025;
  kFloor.receiveShadow = true;
  kitchenGroup.add(kFloor);

  // 2. Muro Norte (Perímetro exterior de la propiedad, Local Z = -11.5)
  const kWallNorth = new THREE.Mesh(new THREE.BoxGeometry(21.0, 3.5, 0.3), kWallMat);
  kWallNorth.position.set(0, 1.75, -11.5);
  kWallNorth.castShadow = true;
  kitchenGroup.add(kWallNorth);

  // 3. Muro Sur (Salida de Emergencia y Acceso de Proveedores desde Estacionamiento, Local Z = +11.5)
  // Contiene la gran puerta de carga y emergencia de doble hoja de 2.5m de ancho y 2.8m de alto
  // Tramo sólido izquierdo: X = -10.5 a +1.0 (ancho 11.5m). Centro en X = -4.75
  const kWallSouthL = new THREE.Mesh(new THREE.BoxGeometry(11.5, 3.5, 0.3), kWallMat);
  kWallSouthL.position.set(-4.75, 1.75, 11.5);
  kWallSouthL.castShadow = true;
  kitchenGroup.add(kWallSouthL);
  
  // Tramo sólido derecho: X = +3.5 a +10.5 (ancho 7.0m). Centro en X = +7.0
  const kWallSouthR = new THREE.Mesh(new THREE.BoxGeometry(7.0, 3.5, 0.3), kWallMat);
  kWallSouthR.position.set(7.0, 1.75, 11.5);
  kWallSouthR.castShadow = true;
  kitchenGroup.add(kWallSouthR);
  
  // Dintel sobre la entrada de proveedores (Z = 25.0 global, Local Z = 11.5, Y: 2.8 a 3.5, altura 0.7m)
  const kDintelSouthProv = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.7, 0.3), kWallMat);
  kDintelSouthProv.position.set(1.25, 3.15, 11.5);
  kDintelSouthProv.castShadow = true;
  kitchenGroup.add(kDintelSouthProv);
  
  // Puertas de proveedores de doble hoja en Y = 0 a 2.8m (nogal rústico)
  const provDoorGeom = new THREE.BoxGeometry(2.5, 2.8, 0.05);
  const provDoor = new THREE.Mesh(provDoorGeom, doorSubMat);
  provDoor.position.set(1.25, 1.4, 11.5);
  kitchenGroup.add(provDoor);

  // 4. Muro Este (Fachada Este - Cerrada y Sólida colindante al estacionamiento, Local X = +10.5)
  const kWallEast = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 23.0), kWallMat);
  kWallEast.position.set(10.5, 1.75, 0.0);
  kWallEast.castShadow = true;
  kitchenGroup.add(kWallEast);

  // 5. Pasillo del Bar y Muro Oeste de la Cocina (Local X = -10.5, global X = 77.0)
  // El pasillo corre en X = 74.0 a 77.0. El muro de la barra y puerta de la cocina está aquí.
  // Tramo sólido posterior 1: Z = -11.5 a -8.5 (ancho 3m)
  const kWallWestS1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 3.0), kWallMat);
  kWallWestS1.position.set(-10.5, 1.75, -10.0);
  kWallWestS1.castShadow = true;
  kitchenGroup.add(kWallWestS1);
  
  // Tramo sólido intermedio 2 (entre la puerta de la cocina y la barra): Z = -7.0 a -4.0 (ancho 3m)
  const kWallWestS2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 3.0), kWallMat);
  kWallWestS2.position.set(-10.5, 1.75, -5.5);
  kWallWestS2.castShadow = true;
  kitchenGroup.add(kWallWestS2);
  
  // Tramo sólido anterior 3 (extremo sur de la cocina): Z = +5.0 a +11.5 (ancho 6.5m)
  const kWallWestS3 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 6.5), kWallMat);
  kWallWestS3.position.set(-10.5, 1.75, 8.25);
  kWallWestS3.castShadow = true;
  kitchenGroup.add(kWallWestS3);
  
  // Dintel sobre la puerta de entrada a la cocina (Z = -8.5 a -7.0, Y: 2.5 a 3.5, ancho 1.5m)
  // Ubicada "a la entrada de la cocina" justo al lado de la barra de bar
  const kDintelWestDoor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 1.5), kWallMat);
  kDintelWestDoor.position.set(-10.5, 3.0, -7.75);
  kDintelWestDoor.castShadow = true;
  kitchenGroup.add(kDintelWestDoor);
  
  // Puerta de nogal del personal hacia la cocina (WC/barra)
  const kKitchenDoor = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.5, 1.5), doorSubMat);
  kKitchenDoor.position.set(-10.5, 1.25, -7.75);
  kitchenGroup.add(kKitchenDoor);
  
  // Apertura de la Barra en el Muro de la Cocina: dintel superior (Z = -4.0 a +5.0, Y: 2.2 a 3.5)
  const kDintelWestBar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.3, 9.0), kWallMat);
  kDintelWestBar.position.set(-10.5, 2.85, 0.5);
  kDintelWestBar.castShadow = true;
  kitchenGroup.add(kDintelWestBar);
  
  // Apertura de la Barra en el Muro de la Cocina: antepecho inferior (Z = -4.0 a +5.0, Y: 0.0 a 1.1)
  const kAntepechoWestBar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 9.0), kWallMat);
  kAntepechoWestBar.position.set(-10.5, 0.55, 0.5);
  kAntepechoWestBar.castShadow = true;
  kAntepechoWestBar.receiveShadow = true;
  kitchenGroup.add(kAntepechoWestBar);

  // 6. El Pasillo Intermedio y Muro Oeste del Pasillo (X = 74.0, local X = -13.5)
  // Este muro divide el pasillo de la barra y el salón de eventos.
  // Posee un portal de acceso de 4m al pasillo en Z = 18.5 a 22.5 (local Z = 5.0 a 9.0)
  // Posee un gran vano arqueado de barra en Z = 9.5 a 18.5 (local Z = -4.0 a +5.0) para que el salón vea el bar
  
  // Tramo sólido posterior 1: Z = -11.5 a -4.0 (ancho 7.5m)
  const pWallWestS1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 7.5), kWallMat);
  pWallWestS1.position.set(-13.5, 1.75, -7.75);
  pWallWestS1.castShadow = true;
  kitchenGroup.add(pWallWestS1);
  
  // Tramo sólido intermedio 2 (pilar entre barra y portal): Z = +5.0 a +6.0 (ancho 1m)
  const pWallWestS2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 1.0), kWallMat);
  pWallWestS2.position.set(-13.5, 1.75, 5.5);
  pWallWestS2.castShadow = true;
  kitchenGroup.add(pWallWestS2);
  
  // Tramo sólido anterior 3 (extremo sur): Z = +10.0 a +11.5 (ancho 1.5m)
  const pWallWestS3 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 1.5), kWallMat);
  pWallWestS3.position.set(-13.5, 1.75, 10.75);
  pWallWestS3.castShadow = true;
  kitchenGroup.add(pWallWestS3);
  
  // Dintel sobre el portal de acceso del salón al pasillo (Z = 5.0 a 10.0 local, Y: 2.8 a 3.5)
  const pDintelPortal = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 4.0), kWallMat);
  pDintelPortal.position.set(-13.5, 3.15, 8.0);
  pDintelPortal.castShadow = true;
  kitchenGroup.add(pDintelPortal);
  
  // Ventana arqueada del Bar hacia el salón: dintel superior (Z = -4.0 a +5.0, Y: 2.2 a 3.5)
  const pDintelBar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.3, 9.0), kWallMat);
  pDintelBar.position.set(-13.5, 2.85, 0.5);
  pDintelBar.castShadow = true;
  kitchenGroup.add(pDintelBar);
  
  // Ventana arqueada del Bar hacia el salón: antepecho inferior (Z = -4.0 a +5.0, Y: 0.0 a 1.1)
  const pAntepechoBar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 9.0), kWallMat);
  pAntepechoBar.position.set(-13.5, 0.55, 0.5);
  pAntepechoBar.castShadow = true;
  pAntepechoBar.receiveShadow = true;
  kitchenGroup.add(pAntepechoBar);

  // Piso del pasillo intermedio (loseta gris oscuro rústica, ancho 3m)
  const pFloor = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.05, 23.0), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }));
  pFloor.position.set(-12.0, 0.025, 0.0);
  pFloor.receiveShadow = true;
  kitchenGroup.add(pFloor);

  // Barra física del bar (Madera y mármol, local X = -9.9 - empotrada dentro de la cocina)
  const barGeom = new THREE.BoxGeometry(1.2, 1.1, 9.0);
  const barMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.55 });
  const bar = new THREE.Mesh(barGeom, barMat);
  bar.position.set(-9.9, 0.55, 0.5);
  bar.castShadow = true;
  bar.receiveShadow = true;
  kitchenGroup.add(bar);
  
  const barTopGeom = new THREE.BoxGeometry(1.3, 0.08, 9.2);
  const barTopMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15, metalness: 0.05 });
  const barTop = new THREE.Mesh(barTopGeom, barTopMat);
  barTop.position.set(-9.85, 1.14, 0.5);
  barTop.castShadow = true;
  kitchenGroup.add(barTop);

  // 7. Equipamiento Industrial de la Cocina (Acero Inoxidable)
  const ssMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.12 });
  
  // Mesa de preparación central 1
  const tableGeom = new THREE.BoxGeometry(1.6, 0.85, 3.5);
  const workTable1 = new THREE.Mesh(tableGeom, ssMat);
  workTable1.position.set(-2.0, 0.425, -4.0);
  workTable1.castShadow = true;
  workTable1.receiveShadow = true;
  kitchenGroup.add(workTable1);
  
  // Mesa de preparación central 2
  const workTable2 = new THREE.Mesh(tableGeom, ssMat);
  workTable2.position.set(-2.0, 0.425, 4.0);
  workTable2.castShadow = true;
  workTable2.receiveShadow = true;
  kitchenGroup.add(workTable2);
  
  // Estufa industrial (pegada al muro norte)
  const stoveGeom = new THREE.BoxGeometry(4.5, 0.9, 1.2);
  const stoveMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 });
  const stove = new THREE.Mesh(stoveGeom, stoveMat);
  stove.position.set(4.0, 0.45, -9.8);
  stove.castShadow = true;
  kitchenGroup.add(stove);
  
  // Campana extractora industrial
  const hoodGeom = new THREE.BoxGeometry(4.7, 0.8, 1.4);
  const hood = new THREE.Mesh(hoodGeom, ssMat);
  hood.position.set(4.0, 2.5, -9.7);
  hood.castShadow = true;
  kitchenGroup.add(hood);
  
  staticEnvironmentGroup.add(kitchenGroup);
  
  // --- G) SERVICIOS SANITARIOS SUBTERRÁNEOS (Modelados debajo del escenario en la sección E) ---
  
  // --- H) RECEPCIÓN PRINCIPAL (LOBBY) CON ALTURA 6.5M Y ACCESOS ABIERTOS ---
  const lobbyGroup = new THREE.Group();
  lobbyGroup.name = "lobby-structure";
  
  const lobbyWallMat = new THREE.MeshStandardMaterial({ color: 0x0c263c, roughness: 0.8 });
  
  // 1. Muro Exterior Sur (Fachada Principal Peatonal y vistas a la alberca, Z = 75.5)
  // Ancho total X: 27 a 75 (48m).
  // Entrada Principal en el centro: X: 48 a 54 (ancho 6m, altura 3.5m)
  // Vano Izquierdo (vistas al jardín de la alberca): X: 32 a 42 (ancho 10m, altura 3.2m)
  // Vano Derecho (vistas al jardín de la alberca): X: 60 a 70 (ancho 10m, altura 3.2m)
  
  // Tramo sólido 1: X: 27 a 32 (ancho 5m)
  const lobbyWallS1 = new THREE.Mesh(new THREE.BoxGeometry(5.0, 6.5, 0.3), lobbyWallMat);
  lobbyWallS1.position.set(29.5, 3.25, 75.5);
  lobbyWallS1.castShadow = true;
  lobbyGroup.add(lobbyWallS1);
  
  // Tramo sólido 2: X: 42 a 48 (ancho 6m)
  const lobbyWallS2 = new THREE.Mesh(new THREE.BoxGeometry(6.0, 6.5, 0.3), lobbyWallMat);
  lobbyWallS2.position.set(45.0, 3.25, 75.5);
  lobbyWallS2.castShadow = true;
  lobbyGroup.add(lobbyWallS2);
  
  // Tramo sólido 3: X: 54 a 60 (ancho 6m)
  const lobbyWallS3 = new THREE.Mesh(new THREE.BoxGeometry(6.0, 6.5, 0.3), lobbyWallMat);
  lobbyWallS3.position.set(57.0, 3.25, 75.5);
  lobbyWallS3.castShadow = true;
  lobbyGroup.add(lobbyWallS3);
  
  // Tramo sólido 4: X: 70 a 75 (ancho 5m)
  const lobbyWallS4 = new THREE.Mesh(new THREE.BoxGeometry(5.0, 6.5, 0.3), lobbyWallMat);
  lobbyWallS4.position.set(72.5, 3.25, 75.5);
  lobbyWallS4.castShadow = true;
  lobbyGroup.add(lobbyWallS4);
  
  // Dintel Entrada Principal Central: X: 48 a 54 (Y: 3.5 a 6.5, altura 3.0m)
  const lobbyDintelCenter = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.0, 0.3), lobbyWallMat);
  lobbyDintelCenter.position.set(51.0, 5.0, 75.5);
  lobbyDintelCenter.castShadow = true;
  lobbyGroup.add(lobbyDintelCenter);
  
  // Dintel Vano Izquierdo: X: 32 a 42 (Y: 3.2 a 6.5, altura 3.3m)
  const lobbyDintelLeft = new THREE.Mesh(new THREE.BoxGeometry(10.0, 3.3, 0.3), lobbyWallMat);
  lobbyDintelLeft.position.set(37.0, 4.85, 75.5);
  lobbyDintelLeft.castShadow = true;
  lobbyGroup.add(lobbyDintelLeft);
  
  // Dintel Vano Derecho: X: 60 a 70 (Y: 3.2 a 6.5, altura 3.3m)
  const lobbyDintelRight = new THREE.Mesh(new THREE.BoxGeometry(10.0, 3.3, 0.3), lobbyWallMat);
  lobbyDintelRight.position.set(65.0, 4.85, 75.5);
  lobbyDintelRight.castShadow = true;
  lobbyGroup.add(lobbyDintelRight);
  
  // Columnas decorativas de cantera rústica en las aperturas de la alberca
  const lobbyColGeom = new THREE.CylinderGeometry(0.15, 0.15, 3.2, 8);
  const lobbyColMat = new THREE.MeshStandardMaterial({ color: COLORS.stonePillars, roughness: 0.8 });
  const lobbyColZs = [32.0, 42.0, 48.0, 54.0, 60.0, 70.0];
  lobbyColZs.forEach(x => {
    const col = new THREE.Mesh(lobbyColGeom, lobbyColMat);
    col.position.set(x, 1.6, 75.5);
    col.castShadow = true;
    lobbyGroup.add(col);
  });

  // 2. Muro Izquierdo de la Recepción (Acceso/Salida de Emergencia y Entrada de Proveedores principal, X = 27.0)
  // Z: 70 a 75.5 (ancho 5.5m). Apertura central para puerta de emergencia marcada en la imagen.
  // Tramo sólido posterior: Z: 70.0 a 71.5 (ancho 1.5m)
  const lobbyWallLeft1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6.5, 1.5), lobbyWallMat);
  lobbyWallLeft1.position.set(27.0, 3.25, 70.75);
  lobbyWallLeft1.castShadow = true;
  lobbyGroup.add(lobbyWallLeft1);
  
  // Tramo sólido anterior: Z: 74.0 a 75.5 (ancho 1.5m)
  const lobbyWallLeft2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6.5, 1.5), lobbyWallMat);
  lobbyWallLeft2.position.set(27.0, 3.25, 74.75);
  lobbyWallLeft2.castShadow = true;
  lobbyGroup.add(lobbyWallLeft2);
  
  // Dintel Puerta de Emergencia: Z: 71.5 a 74.0 (Y: 3.2 a 6.5, altura 3.3m)
  const lobbyDintelLeftJ = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.3, 2.5), lobbyWallMat);
  lobbyDintelLeftJ.position.set(27.0, 4.85, 72.75);
  lobbyDintelLeftJ.castShadow = true;
  lobbyGroup.add(lobbyDintelLeftJ);

  // Gran Puerta Metálica Industrial de Salida de Emergencia y Proveedores (Color Rojo Satinado)
  const emergencyDoorGeom = new THREE.BoxGeometry(0.05, 3.2, 2.5);
  const emergencyDoorMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.8 });
  const emergencyDoor = new THREE.Mesh(emergencyDoorGeom, emergencyDoorMat);
  emergencyDoor.position.set(27.0, 1.6, 72.75);
  emergencyDoor.castShadow = true;
  lobbyGroup.add(emergencyDoor);
  
  // Letreros luminosos "SALIDA DE EMERGENCIA / PROVEEDORES"
  const emergencySignGeom = new THREE.BoxGeometry(0.08, 0.35, 1.2);
  const emergencySignMat = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // Verde LED autoluminoso
  
  const emergencySignOut = new THREE.Mesh(emergencySignGeom, emergencySignMat);
  emergencySignOut.position.set(26.84, 3.5, 72.75); // Lado exterior (estacionamiento/jardín)
  lobbyGroup.add(emergencySignOut);
  
  const emergencySignIn = new THREE.Mesh(emergencySignGeom, emergencySignMat);
  emergencySignIn.position.set(27.16, 3.5, 72.75); // Lado interior (lobby)
  lobbyGroup.add(emergencySignIn);

  // 3. Muro Derecho de la Recepción (Conexión Cocina/Servicio, X = 75.0)
  // Z: 70 a 75.5 (ancho 5.5m). Sólido con puerta de servicio de 1.2m
  const lobbyWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6.5, 5.5), lobbyWallMat);
  lobbyWallRight.position.set(75.0, 3.25, 72.75);
  lobbyWallRight.castShadow = true;
  lobbyGroup.add(lobbyWallRight);
  
  // Piso del Lobby (Mármol crema beige coordinado con el salón)
  const lobbyFloorGeom = new THREE.BoxGeometry(48.0, 0.05, 5.5);
  const lobbyFloorMat = new THREE.MeshStandardMaterial({ color: COLORS.floorSalon, roughness: 0.3 });
  const lobbyFloor = new THREE.Mesh(lobbyFloorGeom, lobbyFloorMat);
  lobbyFloor.position.set(51.0, 0.025, 72.75);
  lobbyFloor.receiveShadow = true;
  lobbyGroup.add(lobbyFloor);
  
  staticEnvironmentGroup.add(lobbyGroup);
  
  // --- I) ALBERCA CON BORDE DE MÁRMOL ---
  // Vaso y agua (X: 39 a 64, Z: 80.5 a 91.5)
  const poolGroup = new THREE.Group();
  poolGroup.position.set(51.5, 0, 86.0); // Centro de la alberca
  
  // Vaso excavado (Y negativo)
  const poolBaseGeom = new THREE.BoxGeometry(25.0, 1.6, 11.0);
  const poolBaseMat = new THREE.MeshStandardMaterial({ color: 0x0e354d, roughness: 0.8 });
  const poolBase = new THREE.Mesh(poolBaseGeom, poolBaseMat);
  poolBase.position.y = -0.8;
  poolBase.receiveShadow = true;
  poolGroup.add(poolBase);
  
  // Agua cristalina (Plano translúcido)
  const waterGeom = new THREE.BoxGeometry(24.8, 0.05, 10.8);
  const waterMat = new THREE.MeshStandardMaterial({
    color: COLORS.water,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85
  });
  const water = new THREE.Mesh(waterGeom, waterMat);
  water.position.y = -0.15; // Justo por debajo del césped
  poolGroup.add(water);
  
  // Borde de mármol perimetral (X: 39 a 64, Z: 80.5 a 91.5)
  const borderGeom = new THREE.BoxGeometry(25.8, 0.1, 11.8);
  const borderMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.25 });
  const pBorder = new THREE.Mesh(borderGeom, borderMat);
  pBorder.position.y = 0.05;
  pBorder.castShadow = true;
  poolGroup.add(pBorder);
  
  // Recorte del borde interior de la alberca
  const borderCut = new THREE.Mesh(new THREE.BoxGeometry(25.0, 0.2, 11.0), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  borderCut.position.y = 0.05;
  // (En Three.js puro no hacemos CSG complejo para rendimiento comercial, pero el marco de borde cubre el vaso perfectamente!)
  
  // Luces sumergidas subacuáticas (Tono cian azulado)
  const uLight1 = new THREE.PointLight(0x00f0ff, 1.5, 10.0, 1.5);
  uLight1.position.set(-6, -0.4, 0);
  poolGroup.add(uLight1);
  const uLight2 = new THREE.PointLight(0x00f0ff, 1.5, 10.0, 1.5);
  uLight2.position.set(6, -0.4, 0);
  poolGroup.add(uLight2);
  
  staticEnvironmentGroup.add(poolGroup);
  
  // --- J) CAPILLA (ESQUINA INFERIOR IZQUIERDA DEL JARDÍN) ---
  // Pabellón de X: 4 a 21 (Ancho 17m), Z: 80 a 92 (Fondo 12m)
  const chapelGroup = new THREE.Group();
  chapelGroup.position.set(12.5, 0, 86.0); // Centro de la capilla
  
  // Suelo de piedra de la capilla
  const cFloorGeom = new THREE.BoxGeometry(17.0, 0.05, 12.0);
  const cFloorMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
  const cFloor = new THREE.Mesh(cFloorGeom, cFloorMat);
  cFloor.position.y = 0.025;
  cFloor.receiveShadow = true;
  chapelGroup.add(cFloor);
  
  // Columnas rústicas de piedra (4 esquinas + 2 intermedias)
  const pillarGeom = new THREE.CylinderGeometry(0.2, 0.2, 3.2, 8);
  const pillarMat = new THREE.MeshStandardMaterial({ color: COLORS.stonePillars, roughness: 0.9 });
  
  const pillarPositions = [
    { x: -8.2, z: -5.7 }, { x: -8.2, z: 5.7 },
    { x: 8.2, z: -5.7 }, { x: 8.2, z: 5.7 },
    { x: 0, z: -5.7 }, { x: 0, z: 5.7 }
  ];
  
  pillarPositions.forEach(pos => {
    const pillar = new THREE.Mesh(pillarGeom, pillarMat);
    pillar.position.set(pos.x, 1.6, pos.z);
    pillar.castShadow = true;
    chapelGroup.add(pillar);
  });
  
  // Altar de piedra blanca
  const altarGeom = new THREE.BoxGeometry(0.8, 0.9, 2.5); // Orientado en el muro izquierdo
  const altarMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
  const altar = new THREE.Mesh(altarGeom, altarMat);
  altar.position.set(-7.5, 0.45, 0);
  altar.castShadow = true;
  chapelGroup.add(altar);
  
  // Techo rústico a dos aguas
  const roofLeftGeom = new THREE.BoxGeometry(17.6, 0.1, 7.2);
  const roofTileMat = new THREE.MeshStandardMaterial({ color: COLORS.tileRoof, roughness: 0.85 });
  
  const roofL = new THREE.Mesh(roofLeftGeom, roofTileMat);
  roofL.position.set(0, 3.2 + (4.5 - 3.2)/2, -3.0);
  roofL.rotation.x = Math.atan2((4.5 - 3.2), 6.0);
  roofL.castShadow = true;
  chapelGroup.add(roofL);
  
  const roofR = new THREE.Mesh(roofLeftGeom, roofTileMat);
  roofR.position.set(0, 3.2 + (4.5 - 3.2)/2, 3.0);
  roofR.rotation.x = -Math.atan2((4.5 - 3.2), 6.0);
  roofR.castShadow = true;
  chapelGroup.add(roofR);
  
  staticEnvironmentGroup.add(chapelGroup);
  
  // --- K) CASCADA DE AGUA ---
  // Pileta de cascada (X: 2.5 a 5.5, Z: 19.5 a 44.5)
  const cascadeGroup = new THREE.Group();
  cascadeGroup.position.set(4.0, 0, 32.0); // Centro de la cascada
  
  const cascadePoolGeom = new THREE.BoxGeometry(3.0, 0.5, 25.0);
  const cascadePoolMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
  const cascadePool = new THREE.Mesh(cascadePoolGeom, cascadePoolMat);
  cascadePool.position.y = 0.25;
  cascadePool.receiveShadow = true;
  cascadeGroup.add(cascadePool);
  
  // Agua de la pileta
  const cascadeWaterGeom = new THREE.BoxGeometry(2.8, 0.4, 24.8);
  const cascadeWater = new THREE.Mesh(cascadeWaterGeom, waterMat);
  cascadeWater.position.y = 0.22;
  cascadeGroup.add(cascadeWater);
  
  // Muro vertical texturizado (X: 2.0 a 3.5, Z: 20.0 a 44.0)
  const cascadeWallGeom = new THREE.BoxGeometry(1.5, 4.0, 24.0);
  const cascadeWallMat = new THREE.MeshStandardMaterial({ color: COLORS.waterfallWall, roughness: 0.15 });
  const cascadeWall = new THREE.Mesh(cascadeWallGeom, cascadeWallMat);
  cascadeWall.position.set(-0.25, 2.0, 0);
  cascadeWall.castShadow = true;
  cascadeGroup.add(cascadeWall);
  
  // Luz de acento en la cascada
  const cascadeLight = new THREE.PointLight(0x93c5fd, 1.2, 15.0, 1.5);
  cascadeLight.position.set(1.5, 1.5, 0);
  cascadeGroup.add(cascadeLight);
  
  staticEnvironmentGroup.add(cascadeGroup);
  
  // --- L) ESTACIONAMIENTO (ZONA VEHICULAR) ---
  // Piso asfalto (X: 77 a 98, Z: 27 a 94)
  const parkingGeom = new THREE.BoxGeometry(21.0, 0.02, 67.0);
  const parkingMat = new THREE.MeshStandardMaterial({ color: COLORS.asphalt, roughness: 0.95 });
  const parking = new THREE.Mesh(parkingGeom, parkingMat);
  parking.position.set(87.5, 0.01, 60.5);
  parking.receiveShadow = true;
  staticEnvironmentGroup.add(parking);
  
  // Autos 3D procedurales para dar escala
  const carColors = [0xb91c1c, 0x1d4ed8, 0x9ca3af];
  const carZs = [35.0, 48.0, 60.0];
  
  carZs.forEach((z, idx) => {
    const car = create3DCar(carColors[idx % 3]);
    car.position.set(idx % 2 === 0 ? 82.0 : 93.0, 0.02, z);
    car.rotation.y = idx % 2 === 0 ? Math.PI / 2 : -Math.PI / 2;
    staticEnvironmentGroup.add(car);
  });
}

/**
 * Crea un carrito 3D minimalista para estacionamiento
 */
function create3DCar(colorHex) {
  const carGroup = new THREE.Group();
  
  const bodyGeom = new THREE.BoxGeometry(4.2, 0.9, 1.8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35 });
  const carBody = new THREE.Mesh(bodyGeom, bodyMat);
  carBody.position.y = 0.55;
  carBody.castShadow = true;
  carGroup.add(carBody);
  
  const cabinGeom = new THREE.BoxGeometry(2.3, 0.7, 1.6);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.1 });
  const cabin = new THREE.Mesh(cabinGeom, cabinMat);
  cabin.position.set(-0.2, 1.25, 0);
  cabin.castShadow = true;
  carGroup.add(cabin);
  
  // Ruedas
  const wheelGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 8);
  wheelGeom.rotateX(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const wPositions = [
    { x: -1.3, z: -0.9 },
    { x: 1.3, z: -0.9 },
    { x: -1.3, z: 0.9 },
    { x: 1.3, z: 0.9 }
  ];
  
  wPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.position.set(pos.x, 0.3, pos.z);
    wheel.castShadow = true;
    carGroup.add(wheel);
  });
  
  return carGroup;
}

/**
 * Crea el aro de selección animado
 */
function createSelectionRing() {
  const ringGeom = new THREE.RingGeometry(1.4, 1.55, 32);
  ringGeom.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: COLORS.gold,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85
  });
  selectionRing = new THREE.Mesh(ringGeom, ringMat);
  selectionRing.position.set(50, -100, 49); // Ocultar
  scene.add(selectionRing);
}

/**
 * Sincroniza la vista 3D con el estado de las mesas en tiempo real
 */
export function syncWithData(tablesData, layout, selectedTableNum) {
  currentTablesData = tablesData;
  currentLayout = layout;
  activeSelectedTableNum = selectedTableNum;
  
  if (!scene) return;
  
  // A) Actualizar la Pista de Baile Dinámica según el Layout (A vs B)
  if (danceFloorMesh && danceFloorBorderMesh) {
    // Liberar geometrías previas para evitar fugas de memoria
    danceFloorMesh.geometry.dispose();
    danceFloorBorderMesh.geometry.dispose();
    
    if (layout === 'A') {
      // Layout A: Pista central de 20m x 13m
      danceFloorMesh.geometry = new THREE.BoxGeometry(20, 0.05, 13);
      danceFloorMesh.position.set(48.5, 0.025 + 0.01, 21.5);
      
      danceFloorBorderMesh.geometry = new THREE.BoxGeometry(20.3, 0.055, 13.3);
      danceFloorBorderMesh.position.set(48.5, 0.025 + 0.008, 21.5);
      
      // Apuntar el proyector de luz coral a la pista de Layout A
      if (spotPista) {
        spotPista.position.set(48.5, 12.0, 21.5);
        spotPista.target.position.set(48.5, 0, 21.5);
      }
    } else {
      // Layout B: Pista longitudinal central de 38m x 8m
      danceFloorMesh.geometry = new THREE.BoxGeometry(38, 0.05, 8);
      danceFloorMesh.position.set(54.0, 0.025 + 0.01, 42.0);
      
      danceFloorBorderMesh.geometry = new THREE.BoxGeometry(38.3, 0.055, 8.3);
      danceFloorBorderMesh.position.set(54.0, 0.025 + 0.008, 42.0);
      
      // Apuntar el proyector de luz coral a la pista de Layout B
      if (spotPista) {
        spotPista.position.set(54.0, 12.0, 42.0);
        spotPista.target.position.set(54.0, 0, 42.0);
      }
    }
  }
  
  // 1. Ocultar el Segundo DJ en 3D según el layout
  const dj23D = staticEnvironmentGroup.getObjectByName("second-dj-3d");
  if (dj23D) {
    dj23D.visible = (layout === 'B');
  } else if (layout === 'B') {
    // Si no está creado y estamos en Layout B, lo creamos
    const dj2G = new THREE.Group();
    dj2G.name = "second-dj-3d";
    dj2G.position.set(74.0, 0, 42.0); // Pegado al muro derecho
    
    const consoleGeom = new THREE.BoxGeometry(0.8, 1.1, 4.0);
    const consoleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const dj2Console = new THREE.Mesh(consoleGeom, consoleMat);
    dj2Console.position.y = 0.55;
    dj2Console.castShadow = true;
    dj2G.add(dj2Console);
    
    // Altavoces a los lados
    const spkGeom = new THREE.BoxGeometry(0.5, 1.4, 0.5);
    const spkMat = new THREE.MeshStandardMaterial({ color: 0x070b12 });
    
    const spkL = new THREE.Mesh(spkGeom, spkMat);
    spkL.position.set(0, 0.7, -2.3);
    spkL.castShadow = true;
    dj2G.add(spkL);
    
    const spkR = new THREE.Mesh(spkGeom, spkMat);
    spkR.position.set(0, 0.7, 2.3);
    spkR.castShadow = true;
    dj2G.add(spkR);
    
    staticEnvironmentGroup.add(dj2G);
  }
  
  // 2. Identificar mesas activas según el layout seleccionado
  // Versión A tiene mesas 1 a 20. Versión B tiene 1 a 17 + 21 (Imperial).
  const activeTablesList = (layout === 'A')
    ? [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
    : [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,21];
  
  // 3. Eliminar mesas 3D que ya no están activas en el layout
  Object.keys(active3dElements).forEach(num => {
    const tableNum = parseInt(num);
    if (!activeTablesList.includes(tableNum)) {
      scene.remove(active3dElements[tableNum]);
      delete active3dElements[tableNum];
    }
  });
  
  // 4. Crear o actualizar mesas activas
  activeTablesList.forEach(num => {
    const data = tablesData[num];
    if (!data) return;
    
    let group = active3dElements[num];
    
    // Si la mesa no existe, o sus parámetros cambiaron (forma, sillas o VIP), la reconstruimos
    if (!group) {
      group = new THREE.Group();
      group.name = `table-group-3d-${num}`;
      group.userData = {
        number: num,
        shape: data.shape,
        seats: data.seats,
        status: data.status
      };
      
      build3DTable(group, data);
      scene.add(group);
      active3dElements[num] = group;
    } else {
      const ud = group.userData;
      if (ud.shape !== data.shape || ud.seats !== data.seats || ud.status !== data.status) {
        // Eliminar hijos y reconstruir
        while (group.children.length > 0) {
          group.remove(group.children[0]);
        }
        
        ud.shape = data.shape;
        ud.seats = data.seats;
        ud.status = data.status;
        
        build3DTable(group, data);
      }
    }
    
    // Posicionar la mesa (Coordenadas en SVG divididas entre 10)
    // El SVG mapea X -> X y Y -> Z en el espacio 3D
    group.position.set(data.cx / 10, 0.05, data.cy / 10);
  });
  
  // 5. Actualizar aro de selección
  updateSelectionRing();
  
  // 6. Actualizar caminos de circulación 3D
  update3DCirculationPaths(layout);
}

/**
 * Selecciona una mesa específica en 3D
 */
export function selectElement3D(num) {
  activeSelectedTableNum = num;
  updateSelectionRing();
}

/**
 * Actualiza la posición y escala del aro de selección
 */
function updateSelectionRing() {
  if (!selectionRing) return;
  
  if (!activeSelectedTableNum || !active3dElements[activeSelectedTableNum]) {
    selectionRing.position.y = -100; // Esconder
    return;
  }
  
  const group = active3dElements[activeSelectedTableNum];
  const data = currentTablesData[activeSelectedTableNum];
  
  if (!data) return;
  
  selectionRing.position.set(group.position.x, 0.08, group.position.z);
  
  // Ajustar tamaño del aro
  let size = 1.3;
  if (data.shape === 'imperial') {
    size = 2.5; // Mayor para la Mesa Imperial
  }
  selectionRing.scale.set(size, size, size);
}

/**
 * Bucle de animación WebGL
 */
function animate() {
  animationFrameId = requestAnimationFrame(animate);
  
  if (controls) controls.update();
  
  // Animación giratoria del aro de selección
  if (selectionRing && activeSelectedTableNum) {
    const time = Date.now() * 0.003;
    selectionRing.rotation.y = time * 0.2;
    const pulse = 1.0 + Math.sin(time * 2.5) * 0.035;
    selectionRing.scale.set(
      (currentTablesData[activeSelectedTableNum]?.shape === 'imperial' ? 2.5 : 1.3) * pulse,
      1,
      (currentTablesData[activeSelectedTableNum]?.shape === 'imperial' ? 2.5 : 1.3) * pulse
    );
  }
  
  // Animación de partículas de flujo de circulación
  if (flowParticles && flowParticles.length > 0) {
    flowParticles.forEach(p => {
      const group = path3DGroups[p.type];
      if (group && group.visible) {
        p.progress += p.speed;
        if (p.progress > 1.0) {
          p.progress = 0.0;
        }
        getPositionAlongPath(p.points, p.progress, p.mesh.position);
      }
    });
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

/* ==========================================
   CONSTRUCCIÓN PROCEDURAL DE MESAS Y SILLAS
   ========================================== */

function build3DTable(group, data) {
  const isImperial = data.shape === 'imperial';
  const isCircle = data.shape === 'circle';
  const seats = data.seats || 10;
  
  // 1. Determinar color del mantel basado en Estatus (Normal/VIP/Reservado)
  let clothColor = COLORS.whiteCloth;
  if (data.status === 'vip') {
    clothColor = 0xffe8a3; // Color crema champán VIP
  } else if (data.status === 'reserved') {
    clothColor = 0xffcdd2; // Color rosado reserved
  }
  
  const tableHeight = 0.75;
  const clothMat = new THREE.MeshStandardMaterial({
    color: clothColor,
    roughness: 0.65,
    metalness: 0.02
  });
  
  // Borde dorado en mesas VIP / Borde rojo en Reservadas
  let borderMat = null;
  if (data.status === 'vip') {
    borderMat = new THREE.MeshStandardMaterial({ color: COLORS.gold, metalness: 0.9, roughness: 0.1 });
  } else if (data.status === 'reserved') {
    borderMat = new THREE.MeshStandardMaterial({ color: COLORS.reservedRed, metalness: 0.2, roughness: 0.5 });
  }
  
  // 2. Crear Tablero de la Mesa
  let w = 1.6;
  let d = 1.6;
  let radius = 0.8;
  
  if (isImperial) {
    // Mesa Imperial (Rectángulo gigante: 2.2m x 48.0m en 3D)
    w = 2.2;
    d = 48.0;
    
    // Tablero rectangular
    const boardGeom = new THREE.BoxGeometry(w, 0.05, d);
    const board = new THREE.Mesh(boardGeom, clothMat);
    board.position.y = tableHeight - 0.025;
    board.castShadow = true;
    board.receiveShadow = true;
    group.add(board);
    
    // Caída de mantel
    const drapeGeom = new THREE.BoxGeometry(w - 0.02, 0.35, d - 0.02);
    const drape = new THREE.Mesh(drapeGeom, clothMat);
    drape.position.y = tableHeight - 0.2;
    group.add(drape);
    
    // Patas modulares (Múltiples a lo largo de los 48 metros)
    const legGeom = new THREE.CylinderGeometry(0.05, 0.05, tableHeight - 0.05, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.6, roughness: 0.3 });
    for (let zOffset = -22.0; zOffset <= 22.0; zOffset += 4.0) {
      const legL = new THREE.Mesh(legGeom, legMat);
      legL.position.set(-0.7, (tableHeight - 0.05) / 2, zOffset);
      group.add(legL);
      
      const legR = new THREE.Mesh(legGeom, legMat);
      legR.position.set(0.7, (tableHeight - 0.05) / 2, zOffset);
      group.add(legR);
    }
    
    // Centros de mesa florales decorativos (cada 4 metros)
    const vaseGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
    const vaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.15 });
    const flowersGeom = new THREE.SphereGeometry(0.16, 8, 8);
    const flowersMat = new THREE.MeshStandardMaterial({ color: COLORS.roseCoral, roughness: 0.9 });
    for (let zOffset = -20.0; zOffset <= 20.0; zOffset += 6.0) {
      const vase = new THREE.Mesh(vaseGeom, vaseMat);
      vase.position.set(0, tableHeight + 0.075, zOffset);
      group.add(vase);
      
      const flowers = new THREE.Mesh(flowersGeom, flowersMat);
      flowers.position.set(0, tableHeight + 0.18, zOffset);
      group.add(flowers);
    }
    
    // Distribuir sillas Tiffany (50 total: 24 a cada lado + 1 arriba + 1 abajo)
    const chairGroup = new THREE.Group();
    const sideChairsCount = 24;
    const step = 46.0 / (sideChairsCount - 1);
    
    // Top chair
    const chairTop = create3DChair();
    chairTop.position.set(0, 0, -24.4);
    chairTop.rotation.y = 0; // Mirando al sur
    chairGroup.add(chairTop);
    
    // Bottom chair
    const chairBottom = create3DChair();
    chairBottom.position.set(0, 0, 24.4);
    chairBottom.rotation.y = Math.PI; // Mirando al norte
    chairGroup.add(chairBottom);
    
    // Sillas laterales
    for (let c = 0; c < sideChairsCount; c++) {
      const z = -23.0 + c * step;
      
      // Lado Izquierdo (X negativo, mira a la derecha rot = Math.PI / 2)
      const chairL = create3DChair();
      chairL.position.set(-1.4, 0, z);
      chairL.rotation.y = Math.PI / 2;
      chairGroup.add(chairL);
      
      // Lado Derecho (X positivo, mira a la izquierda rot = -Math.PI / 2)
      const chairR = create3DChair();
      chairR.position.set(1.4, 0, z);
      chairR.rotation.y = -Math.PI / 2;
      chairGroup.add(chairR);
    }
    
    group.add(chairGroup);
    
  } else {
    // Mesa Normal (Cuadrada o Redonda de 1.6m)
    if (isCircle) {
      // Redonda
      const boardGeom = new THREE.CylinderGeometry(radius, radius, 0.04, 24);
      const board = new THREE.Mesh(boardGeom, clothMat);
      board.position.y = tableHeight - 0.02;
      board.castShadow = true;
      board.receiveShadow = true;
      group.add(board);
      
      const drapeGeom = new THREE.CylinderGeometry(radius, radius + 0.02, 0.28, 24, 1, true);
      const drape = new THREE.Mesh(drapeGeom, clothMat);
      drape.position.y = tableHeight - 0.16;
      group.add(drape);
      
      if (borderMat) {
        const ringGeom = new THREE.CylinderGeometry(radius + 0.01, radius + 0.01, 0.045, 24, 1, true);
        const ring = new THREE.Mesh(ringGeom, borderMat);
        ring.position.y = tableHeight - 0.02;
        group.add(ring);
      }
    } else {
      // Cuadrada
      const boardGeom = new THREE.BoxGeometry(w, 0.04, d);
      const board = new THREE.Mesh(boardGeom, clothMat);
      board.position.y = tableHeight - 0.02;
      board.castShadow = true;
      board.receiveShadow = true;
      group.add(board);
      
      const drapeGeom = new THREE.BoxGeometry(w - 0.01, 0.28, d - 0.01);
      const drape = new THREE.Mesh(drapeGeom, clothMat);
      drape.position.y = tableHeight - 0.16;
      group.add(drape);
      
      if (borderMat) {
        const frameGeom = new THREE.BoxGeometry(w + 0.02, 0.045, d + 0.02);
        const frame = new THREE.Mesh(frameGeom, borderMat);
        frame.position.y = tableHeight - 0.02;
        // Quitar volumen central para que sea un marco decorativo sutil
        group.add(frame);
      }
    }
    
    // Pata central
    const legGeom = new THREE.CylinderGeometry(0.04, 0.04, tableHeight - 0.04, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.5, roughness: 0.25 });
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.y = (tableHeight - 0.04) / 2;
    group.add(leg);
    
    // Florero centro de mesa
    const vaseGeom = new THREE.CylinderGeometry(0.05, 0.06, 0.12, 8);
    const vaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8 });
    const vase = new THREE.Mesh(vaseGeom, vaseMat);
    vase.position.y = tableHeight + 0.06;
    group.add(vase);
    
    const flowersGeom = new THREE.SphereGeometry(0.1, 8, 8);
    const flowersMat = new THREE.MeshStandardMaterial({ color: COLORS.roseCoral, roughness: 0.95 });
    const flowers = new THREE.Mesh(flowersGeom, flowersMat);
    flowers.position.y = tableHeight + 0.13;
    group.add(flowers);
    
    // Distribuir sillas en círculo o cuadrado
    const chairGroup = new THREE.Group();
    const chairRadius = radius + 0.26;
    
    if (isCircle) {
      // Circular
      for (let i = 0; i < seats; i++) {
        const angle = (i * 2 * Math.PI) / seats;
        const chair = create3DChair();
        chair.position.set(Math.sin(angle) * chairRadius, 0, Math.cos(angle) * chairRadius);
        chair.rotation.y = angle + Math.PI; // Mirando al centro
        chairGroup.add(chair);
      }
    } else {
      // Cuadrada (Sillas distribuidas simétricamente en 4 caras)
      let chairsConfig = [];
      
      if (seats === 8) {
        // 2 por lado
        const o = 0.28;
        const d = radius + 0.22;
        chairsConfig = [
          { x: -o, z: -d, rot: 0 }, { x: o, z: -d, rot: 0 },         // Norte
          { x: -o, z: d, rot: Math.PI }, { x: o, z: d, rot: Math.PI }, // Sur
          { x: -d, z: -o, rot: Math.PI/2 }, { x: -d, z: o, rot: Math.PI/2 }, // Oeste
          { x: d, z: -o, rot: -Math.PI/2 }, { x: d, z: o, rot: -Math.PI/2 }  // Este
        ];
      } else if (seats === 10) {
        // 3 arriba/abajo, 2 izquierda/derecha
        const o = 0.35;
        const d = radius + 0.22;
        chairsConfig = [
          { x: -o, z: -d, rot: 0 }, { x: 0, z: -d, rot: 0 }, { x: o, z: -d, rot: 0 }, // Norte
          { x: -o, z: d, rot: Math.PI }, { x: 0, z: d, rot: Math.PI }, { x: o, z: d, rot: Math.PI }, // Sur
          { x: -d, z: -0.22, rot: Math.PI/2 }, { x: -d, z: 0.22, rot: Math.PI/2 }, // Oeste
          { x: d, z: -0.22, rot: -Math.PI/2 }, { x: d, z: 0.22, rot: -Math.PI/2 }  // Este
        ];
      } else {
        // 12 comensales (3 por cara)
        const o = 0.35;
        const d = radius + 0.22;
        chairsConfig = [
          { x: -o, z: -d, rot: 0 }, { x: 0, z: -d, rot: 0 }, { x: o, z: -d, rot: 0 },
          { x: -o, z: d, rot: Math.PI }, { x: 0, z: d, rot: Math.PI }, { x: o, z: d, rot: Math.PI },
          { x: -d, z: -o, rot: Math.PI/2 }, { x: -d, z: 0, rot: Math.PI/2 }, { x: -d, z: o, rot: Math.PI/2 },
          { x: d, z: -o, rot: -Math.PI/2 }, { x: d, z: 0, rot: -Math.PI/2 }, { x: d, z: o, rot: -Math.PI/2 }
        ];
      }
      
      chairsConfig.forEach(pos => {
        const chair = create3DChair();
        chair.position.set(pos.x, 0, pos.z);
        chair.rotation.y = pos.rot;
        chairGroup.add(chair);
      });
    }
    
    group.add(chairGroup);
  }
}

/**
 * Crea una silla Tiffany dorada detallada en 3D
 */
function create3DChair() {
  const group = new THREE.Group();
  const seatHeight = 0.44;
  
  // Asiento acolchado (tela azul oscuro)
  const seatGeom = new THREE.BoxGeometry(0.38, 0.05, 0.38);
  const seatMat = new THREE.MeshStandardMaterial({ color: COLORS.chairSeat, roughness: 0.8 });
  const seat = new THREE.Mesh(seatGeom, seatMat);
  seat.position.y = seatHeight;
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);
  
  // Respaldo de rejilla dorado estilizado
  const frameMat = new THREE.MeshStandardMaterial({ color: COLORS.chairGoldFrame, metalness: 0.8, roughness: 0.25 });
  const backGeom = new THREE.BoxGeometry(0.38, 0.42, 0.03);
  const back = new THREE.Mesh(backGeom, frameMat);
  back.position.set(0, seatHeight + 0.21, -0.175);
  back.castShadow = true;
  group.add(back);
  
  // Patas doradas delgadas
  const legGeom = new THREE.CylinderGeometry(0.015, 0.015, seatHeight, 6);
  
  const legPositions = [
    { x: -0.16, z: -0.16 },
    { x: 0.16, z: -0.16 },
    { x: -0.16, z: 0.16 },
    { x: 0.16, z: 0.16 }
  ];
  
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeom, frameMat);
    leg.position.set(pos.x, seatHeight / 2, pos.z);
    leg.castShadow = true;
    group.add(leg);
  });
  
  return group;
}

/* ==========================================================
   SISTEMA DE PARSEO Y SIMULACIÓN DE FLUJOS DE LOGÍSTICA 3D
   ========================================================== */

/**
 * Parsea una cadena de ruta de SVG (d) y la convierte en un array de arrays de THREE.Vector3
 */
function parseSVGPathTo3DLines(dString) {
  if (!dString) return [];
  
  // Limpieza de la cadena y estandarización de comandos
  const cleaned = dString.replace(/,/g, ' ').replace(/([MLC])/gi, ' $1 ').trim();
  const tokens = cleaned.split(/\s+/);
  
  const lines = [];
  let currentLine = [];
  
  let i = 0;
  let lastX = 0;
  let lastY = 0;
  
  while (i < tokens.length) {
    const token = tokens[i];
    if (!token) {
      i++;
      continue;
    }
    
    if (token === 'M' || token === 'm') {
      if (currentLine.length > 1) {
        lines.push(currentLine);
      }
      currentLine = [];
      const x = parseFloat(tokens[i+1]);
      const y = parseFloat(tokens[i+2]);
      if (!isNaN(x) && !isNaN(y)) {
        const pt = new THREE.Vector3(x / 10, 0.08, y / 10);
        currentLine.push(pt);
        lastX = x;
        lastY = y;
      }
      i += 3;
    } else if (token === 'L' || token === 'l') {
      const x = parseFloat(tokens[i+1]);
      const y = parseFloat(tokens[i+2]);
      if (!isNaN(x) && !isNaN(y)) {
        const pt = new THREE.Vector3(x / 10, 0.08, y / 10);
        currentLine.push(pt);
        lastX = x;
        lastY = y;
      }
      i += 3;
    } else if (token === 'C' || token === 'c') {
      const cp1x = parseFloat(tokens[i+1]);
      const cp1y = parseFloat(tokens[i+2]);
      const cp2x = parseFloat(tokens[i+3]);
      const cp2y = parseFloat(tokens[i+4]);
      const destx = parseFloat(tokens[i+5]);
      const desty = parseFloat(tokens[i+6]);
      
      if (!isNaN(cp1x) && !isNaN(cp1y) && !isNaN(cp2x) && !isNaN(cp2y) && !isNaN(destx) && !isNaN(desty)) {
        const pStart = new THREE.Vector3(lastX / 10, 0.08, lastY / 10);
        const pCP1 = new THREE.Vector3(cp1x / 10, 0.08, cp1y / 10);
        const pCP2 = new THREE.Vector3(cp2x / 10, 0.08, cp2y / 10);
        const pEnd = new THREE.Vector3(destx / 10, 0.08, desty / 10);
        
        const curve = new THREE.CubicBezierCurve3(pStart, pCP1, pCP2, pEnd);
        const curvePoints = curve.getPoints(12); // Mayor muestreo para curvas súper fluidas
        for (let j = 1; j < curvePoints.length; j++) {
          currentLine.push(curvePoints[j]);
        }
        
        lastX = destx;
        lastY = desty;
      }
      i += 7;
    } else {
      // Coordenadas implícitas después de un comando
      if (currentLine.length > 0) {
        const x = parseFloat(token);
        const y = parseFloat(tokens[i+1]);
        if (!isNaN(x) && !isNaN(y)) {
          const pt = new THREE.Vector3(x / 10, 0.08, y / 10);
          currentLine.push(pt);
          lastX = x;
          lastY = y;
          i += 2;
          continue;
        }
      }
      i++;
    }
  }
  
  if (currentLine.length > 1) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Calcula la longitud total acumulada de una línea de puntos
 */
function calculatePathLength(points) {
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += points[i].distanceTo(points[i+1]);
  }
  return len;
}

/**
 * Obtiene la posición (Vector3) a lo largo de un camino según un progreso t (0 a 1)
 */
function getPositionAlongPath(points, progress, targetVector) {
  if (!points || points.length === 0) return;
  if (points.length === 1) {
    targetVector.copy(points[0]);
    return;
  }
  
  const lengths = [0];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = points[i].distanceTo(points[i+1]);
    totalLength += d;
    lengths.push(totalLength);
  }
  
  if (totalLength === 0) {
    targetVector.copy(points[0]);
    return;
  }
  
  const targetLength = progress * totalLength;
  
  let segmentIdx = 0;
  for (let i = 0; i < lengths.length - 1; i++) {
    if (targetLength >= lengths[i] && targetLength <= lengths[i+1]) {
      segmentIdx = i;
      break;
    }
  }
  
  const startPt = points[segmentIdx];
  const endPt = points[segmentIdx + 1];
  const segmentLength = lengths[segmentIdx + 1] - lengths[segmentIdx];
  
  if (segmentLength === 0) {
    targetVector.copy(startPt);
    return;
  }
  
  const segmentProgress = (targetLength - lengths[segmentIdx]) / segmentLength;
  targetVector.lerpVectors(startPt, endPt, segmentProgress);
}

/**
 * Reconstruye y sincroniza los flujos de circulación en 3D
 */
function update3DCirculationPaths(layout) {
  if (!scene) return;
  
  // 1. Limpiar partículas anteriores de la cola de animación
  flowParticles = [];
  
  // 2. Eliminar y limpiar los grupos 3D anteriores de la escena
  const types = ['guest', 'service', 'emergency'];
  types.forEach(type => {
    if (path3DGroups[type]) {
      scene.remove(path3DGroups[type]);
      path3DGroups[type] = null;
    }
  });
  
  const pathColors = {
    guest: 0x3b82f6,      // Azul brillante satinado para invitados
    service: 0x10b981,    // Verde brillante para proveedores y staff
    emergency: 0xef4444   // Rojo brillante para evacuación/emergencia
  };
  
  // 3. Generar caminos para cada capa interactiva
  types.forEach(type => {
    const pathEl = document.getElementById(`path-${type}-draw`);
    if (!pathEl) return;
    
    const dString = pathEl.getAttribute('d');
    if (!dString) return;
    
    const lines = parseSVGPathTo3DLines(dString);
    if (lines.length === 0) return;
    
    const group = new THREE.Group();
    group.name = `path-group-3d-${type}`;
    
    // Material de la línea base (camino translúcido)
    const lineMat = new THREE.LineBasicMaterial({
      color: pathColors[type],
      transparent: true,
      opacity: 0.35
    });
    
    lines.forEach(line => {
      const geometry = new THREE.BufferGeometry().setFromPoints(line);
      const lineMesh = new THREE.Line(geometry, lineMat);
      group.add(lineMesh);
      
      // Crear partículas brillantes ("gotas de luz") fluyendo a lo largo de este segmento
      const pathLen = calculatePathLength(line);
      // Ajustar densidad de partículas a 1 cada 3.5 metros para que sea una simulación viva y premium
      const numParticles = Math.max(3, Math.floor(pathLen / 3.5));
      
      const particleGeom = new THREE.SphereGeometry(0.14, 8, 8); // Esferas discretas brillantes
      const particleMat = new THREE.MeshBasicMaterial({
        color: pathColors[type],
        transparent: true,
        opacity: 0.95
      });
      
      for (let p = 0; p < numParticles; p++) {
        const particleMesh = new THREE.Mesh(particleGeom, particleMat);
        
        // Desfase inicial equitativo a lo largo de la ruta
        const progress = p / numParticles;
        getPositionAlongPath(line, progress, particleMesh.position);
        group.add(particleMesh);
        
        flowParticles.push({
          mesh: particleMesh,
          points: line,
          progress: progress,
          speed: 0.004 + Math.random() * 0.002, // Velocidades suaves desfasadas individualmente
          type: type
        });
      }
    });
    
    // Sincronizar visibilidad con el estado actual del checkbox de la interfaz de usuario (2D)
    const checkbox = document.getElementById(`path-${type}`);
    group.visible = checkbox ? checkbox.checked : false;
    
    scene.add(group);
    path3DGroups[type] = group;
  });
}

/**
 * Controla la visibilidad de los flujos de circulación en la escena 3D al vuelo
 */
export function toggleCirculation3D(pathType, isChecked) {
  const group = path3DGroups[pathType];
  if (group) {
    group.visible = isChecked;
  }
}
