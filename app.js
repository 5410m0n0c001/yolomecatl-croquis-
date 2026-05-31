/**
 * Yolomecatl - Planificador y Visualizador de Eventos
 * Technical CAD Interactivity & Render Engine
 */

import { init3D, destroy3D, syncWithData, selectElement3D, resetCamera3D, toggleCirculation3D } from "./visualizer3d.js";

// --- STATE MANAGEMENT ---
let currentTheme = 'premium';
let currentLayout = 'A';
let globalDensity = 10;
let selectedTableNum = null;
let zoomScale = 1.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX = 0;
let startY = 0;

/// Central coordinates for each table — Layout A (original, 20 mesas)
const tablePositions = {
  1: { cx: 320, cy: 647 },
  2: { cx: 430, cy: 647 },
  3: { cx: 540, cy: 647 },
  4: { cx: 650, cy: 647 },
  
  5: { cx: 320, cy: 549 },
  6: { cx: 430, cy: 549 },
  7: { cx: 540, cy: 549 },
  8: { cx: 650, cy: 549 },
  
  9: { cx: 320, cy: 451 },
  10: { cx: 430, cy: 451 },
  11: { cx: 540, cy: 451 },
  12: { cx: 650, cy: 451 },
  
  13: { cx: 320, cy: 353 },
  14: { cx: 430, cy: 353 },
  15: { cx: 540, cy: 353 },
  16: { cx: 650, cy: 353 },
  
  17: { cx: 320, cy: 255 },
  18: { cx: 320, cy: 175 },
  19: { cx: 650, cy: 255 },
  20: { cx: 650, cy: 175 },
  21: { cx: 305, cy: 400 }
};

// Layout configurations: A = original, B = pista longitudinal central
const layoutPositions = {
  A: {
    activeTables: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    tables: {
      1: { cx: 320, cy: 647 }, 2: { cx: 430, cy: 647 },
      3: { cx: 540, cy: 647 }, 4: { cx: 650, cy: 647 },
      5: { cx: 320, cy: 549 }, 6: { cx: 430, cy: 549 },
      7: { cx: 540, cy: 549 }, 8: { cx: 650, cy: 549 },
      9: { cx: 320, cy: 451 }, 10: { cx: 430, cy: 451 },
      11: { cx: 540, cy: 451 }, 12: { cx: 650, cy: 451 },
      13: { cx: 320, cy: 353 }, 14: { cx: 430, cy: 353 },
      15: { cx: 540, cy: 353 }, 16: { cx: 650, cy: 353 },
      17: { cx: 320, cy: 255 }, 18: { cx: 320, cy: 175 },
      19: { cx: 650, cy: 255 }, 20: { cx: 650, cy: 175 },
      21: { cx: 305, cy: 400 }
    },
    dancefloor: { x: 385, y: 150, width: 200, height: 130, labelX: 485, labelY: 215, labelRotate: false },
    paths: {
      guest: "M 980,770 L 875,770 L 510,770 L 510,755 L 510,730 L 510,700 M 510,770 L 200,770 L 200,860 L 210,860 M 510,730 L 290,727 L 270,727 L 200,727 L 200,860 L 210,860 M 810,300 L 875,300 M 945,360 L 875,360 M 285,150 L 735,150 L 735,690 L 285,690 L 285,150 M 375,150 L 375,690 M 485,150 L 485,690 M 595,150 L 595,690 M 285,300 L 735,300 M 285,400 L 735,400 M 285,500 L 735,500 M 285,600 L 735,600 M 375,250 C 310,250 310,250 310,60 L 440,60 M 595,250 C 690,250 690,250 690,60 L 580,60",
      service: "M 980,770 L 875,770 L 875,280 L 750,280 L 735,280 M 735,280 L 720,280 L 720,220 L 760,220 L 760,180 L 720,180 M 690,150 L 690,690 M 690,175 L 285,175 M 690,255 L 285,255 M 690,353 L 285,353 M 690,451 L 285,451 M 690,549 L 285,549 M 690,647 L 285,647 M 375,175 L 375,647 M 485,175 L 485,647 M 595,175 L 595,647 M 690,175 L 590,175 L 590,80 M 375,175 L 345,175 L 345,80 M 590,80 L 590,60 L 580,60 M 345,80 L 345,60 L 440,60 M 690,690 L 510,700 L 270,727 L 200,727 L 200,860 L 210,860",
      emergency: "M 285,95 L 285,685 L 300,705 L 510,705 L 510,755 L 510,770 L 980,770 M 735,95 L 735,280 L 755,280 L 875,280 L 875,770 L 980,770 M 735,280 L 735,685 L 700,705 L 510,705"
    }
  },
  B: {
    // Pista horizontal central: y=380-460
    // Arriba: 9 mesas (3x3 grid)
    // Abajo:  8 mesas (4x2 grid)
    // Izquierda: Mesa Imperial (50 sillas, vertical)
    activeTables: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,21],
    tables: {
      1: { cx: 410, cy: 190 },
      2: { cx: 410, cy: 265 },
      3: { cx: 410, cy: 340 },
      4: { cx: 520, cy: 190 },
      5: { cx: 520, cy: 265 },
      6: { cx: 520, cy: 340 },
      7: { cx: 630, cy: 190 },
      8: { cx: 630, cy: 265 },
      9: { cx: 630, cy: 340 },
      10: { cx: 410, cy: 515 },
      11: { cx: 410, cy: 615 },
      12: { cx: 490, cy: 515 },
      13: { cx: 490, cy: 615 },
      14: { cx: 570, cy: 515 },
      15: { cx: 570, cy: 615 },
      16: { cx: 650, cy: 515 },
      17: { cx: 650, cy: 615 },
      18: { cx: 305, cy: 175 }, 19: { cx: 665, cy: 175 }, 20: { cx: 665, cy: 175 },
      21: { cx: 305, cy: 400 }
    },
    dancefloor: { x: 350, y: 380, width: 380, height: 80, labelX: 540, labelY: 425, labelRotate: false },
    paths: {
      guest: "M 980,770 L 875,770 L 510,770 L 510,755 L 510,730 L 510,700 M 510,770 L 200,770 L 200,860 L 210,860 M 510,730 L 290,727 L 270,727 L 200,727 L 200,860 L 210,860 M 810,300 L 875,300 M 945,360 L 875,360 M 355,150 L 285,150 L 285,650 L 355,650 L 355,150 M 355,150 L 735,150 L 735,690 L 355,690 L 355,150 M 465,150 L 465,690 M 575,150 L 575,690 M 355,265 L 735,265 M 355,515 L 735,515 M 355,615 L 735,615 M 355,420 L 730,420 M 465,265 C 310,265 310,250 310,60 L 440,60 M 575,265 C 690,265 690,250 690,60 L 580,60",
      service: "M 980,770 L 875,770 L 875,280 L 750,280 L 735,280 M 735,280 L 720,280 L 720,220 L 760,220 L 760,180 L 720,180 M 735,280 L 735,420 L 740,420 M 690,150 L 690,690 M 690,190 L 285,190 M 690,265 L 285,265 M 690,340 L 285,340 M 690,420 L 285,420 M 690,515 L 285,515 M 690,615 L 285,615 M 355,190 L 355,615 M 465,190 L 465,615 M 575,190 L 575,615 M 690,190 L 590,190 L 590,80 M 355,190 L 345,190 L 345,80 M 590,80 L 590,60 L 580,60 M 345,80 L 345,60 L 440,60 M 690,690 L 510,700 L 270,727 L 200,727 L 200,860 L 210,860",
      emergency: "M 285,95 L 285,685 L 300,705 L 510,705 L 510,755 L 510,770 L 980,770 M 735,95 L 735,280 L 755,280 L 875,280 L 875,770 L 980,770 M 735,280 L 735,685 L 700,705 L 510,705"
    }
  }
};

// Initialize Table Data
const tablesData = {};
for (let i = 1; i <= 21; i++) {
  tablesData[i] = {
    number: i,
    shape: i === 21 ? 'imperial' : 'square',
    seats: i === 21 ? 50 : 10,
    status: 'normal',
    guests: [],
    cx: tablePositions[i] ? tablePositions[i].cx : 305,
    cy: tablePositions[i] ? tablePositions[i].cy : 400,
    active: true
  };
}

// --- DOM ELEMENTS ---
const svgElement = document.getElementById('event-svg');
const detailDrawer = document.getElementById('detail-drawer');
const drawerTitle = document.getElementById('drawer-title');
const tableShapeSelect = document.getElementById('table-shape');
const tableSeatsSelect = document.getElementById('table-seats');
const tableStatusSelect = document.getElementById('table-status');
const tableGuestsTextarea = document.getElementById('table-guests');
const guestCountLabel = document.getElementById('guest-count-label');
const welcomeOverlay = document.getElementById('welcome-overlay');

// Distance Metrics placeholders
const metricDistPista = document.getElementById('metric-dist-pista');
const metricDistDJ = document.getElementById('metric-dist-dj');
const metricDistWc = document.getElementById('metric-dist-wc');
const metricDistBar = document.getElementById('metric-dist-bar');

// --- INIT APP ---
window.addEventListener('DOMContentLoaded', () => {
  // Wrap all visual layers in a main viewport group for easy zoom/pan
  wrapLayersInViewport();
  
  // Render chairs for all tables initially
  renderAllTables();
  
  // Calculate and display starting total capacity
  updateGlobalMetrics();
  
  // Setup SVG Drag-to-Pan listeners
  setupCanvasInteraction();

  // Bind swipe to close gestures on mobile sidebar
  setupSidebarSwipeGesture();

  // Registrar listeners para conmutadores de vista 2D/3D
  const btn2d = document.getElementById('btn-view-2d');
  const btn3d = document.getElementById('btn-view-3d');
  if (btn2d && btn3d) {
    btn2d.addEventListener('click', () => setViewMode('2d'));
    btn3d.addEventListener('click', () => setViewMode('3d'));
  }

  const btnResetCam = document.getElementById('btn-reset-cam-3d');
  if (btnResetCam) {
    btnResetCam.addEventListener('click', () => {
      if (activeView === '3d') {
        resetCamera3D();
      }
    });
  }

  // Parse URL query parameters for deep linking (e.g. ?layout=B&theme=cad-dark)
  const urlParams = new URLSearchParams(window.location.search);
  const layoutParam = urlParams.get('layout');
  const themeParam = urlParams.get('theme');
  const emulateParam = urlParams.get('emulate-print');
  
  if (layoutParam && (layoutParam === 'A' || layoutParam === 'B')) {
    setLayout(layoutParam);
  }
  if (themeParam && ['premium', 'cad-dark', 'cad-light', 'minimalist'].includes(themeParam)) {
    setTheme(themeParam);
  }
  if (emulateParam === 'true') {
    document.body.classList.add('emulate-print');
    resetCanvasView();
  }
});

// Wrap layers in viewport group dynamically
function wrapLayersInViewport() {
  const svg = document.getElementById('event-svg');
  const viewport = document.createElementNS("http://www.w3.org/2000/svg", "g");
  viewport.setAttribute('id', 'main-viewport');
  
  // Move all children except <defs> into the viewport group
  const children = Array.from(svg.children);
  children.forEach(child => {
    if (child.tagName !== 'defs') {
      viewport.appendChild(child);
    }
  });
  
  svg.appendChild(viewport);
}

// Close Welcome Splash
function closeWelcome() {
  welcomeOverlay.style.opacity = '0';
  setTimeout(() => {
    welcomeOverlay.style.display = 'none';
  }, 500);
}

// --- TABLE RENDERING ENGINE ---
// Renders the table top + chairs around it dynamically inside the SVG table group
function renderTable(num) {
  const tableData = tablesData[num];
  const group = document.getElementById(`table-group-${num}`);
  if (!group) return;
  
  // Clear existing content in group
  group.innerHTML = '';
  
  // Apply select highlights
  const isSelected = (selectedTableNum === num);
  
  // Create Main Table Element
  let tableEl;
  const halfSize = 21; // 42 width, 21 radius
  
  if (tableData.shape === 'imperial') {
    // Imperial table shape: a long vertical rectangle!
    tableEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tableEl.setAttribute('x', -11);
    tableEl.setAttribute('y', -240);
    tableEl.setAttribute('width', 22);
    tableEl.setAttribute('height', 480);
    tableEl.setAttribute('rx', 4);
  } else if (tableData.shape === 'square') {
    tableEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tableEl.setAttribute('x', -halfSize);
    tableEl.setAttribute('y', -halfSize);
    tableEl.setAttribute('width', halfSize * 2);
    tableEl.setAttribute('height', halfSize * 2);
    tableEl.setAttribute('rx', 4);
  } else {
    tableEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    tableEl.setAttribute('cx', 0);
    tableEl.setAttribute('cy', 0);
    tableEl.setAttribute('r', halfSize);
  }
  
  // Style classes
  let classList = ['svg-table-block'];
  if (tableData.shape === 'imperial') classList.push('imperial');
  if (tableData.status === 'vip') classList.push('vip');
  if (tableData.status === 'reserved') classList.push('reserved');
  if (isSelected) classList.push('active-selected');
  tableEl.setAttribute('class', classList.join(' '));
  
  // Click handler to select table
  tableEl.addEventListener('click', (e) => {
    e.stopPropagation();
    selectTable(num);
  });
  
  // Hover effects on table tooltip
  tableEl.addEventListener('mousemove', (e) => showTooltip(e, num));
  tableEl.addEventListener('mouseleave', hideTooltip);

  group.appendChild(tableEl);
  
  // Render Chairs around the table
  const chairsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  chairsGroup.setAttribute('class', 'chairs-group');
  
  const numChairs = tableData.seats;
  const chairR = 30; // Radius distance of chair from center
  const chairW = 8;
  const chairH = 8;
  
  if (tableData.shape === 'imperial') {
    const paddingX = 17;
    
    // Top chair
    const chairTop = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    chairTop.setAttribute('x', -chairW / 2);
    chairTop.setAttribute('y', -252);
    chairTop.setAttribute('width', chairW);
    chairTop.setAttribute('height', chairH);
    chairTop.setAttribute('rx', 1);
    chairTop.setAttribute('class', 'svg-chair imperial-chair');
    chairsGroup.appendChild(chairTop);
    
    // Bottom chair
    const chairBottom = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    chairBottom.setAttribute('x', -chairW / 2);
    chairBottom.setAttribute('y', 244);
    chairBottom.setAttribute('width', chairW);
    chairBottom.setAttribute('height', chairH);
    chairBottom.setAttribute('rx', 1);
    chairBottom.setAttribute('class', 'svg-chair imperial-chair');
    chairsGroup.appendChild(chairBottom);
    
    // Side chairs
    const sideChairsCount = Math.floor((numChairs - 2) / 2); // default 24
    const step = 460 / (sideChairsCount - 1);
    for (let c = 0; c < sideChairsCount; c++) {
      const cy = -230 + c * step;
      
      const chairL = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      chairL.setAttribute('x', -paddingX - chairW / 2);
      chairL.setAttribute('y', cy - chairH / 2);
      chairL.setAttribute('width', chairW);
      chairL.setAttribute('height', chairH);
      chairL.setAttribute('rx', 1);
      chairL.setAttribute('class', 'svg-chair imperial-chair');
      chairsGroup.appendChild(chairL);
      
      const chairR = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      chairR.setAttribute('x', paddingX - chairW / 2);
      chairR.setAttribute('y', cy - chairH / 2);
      chairR.setAttribute('width', chairW);
      chairR.setAttribute('height', chairH);
      chairR.setAttribute('rx', 1);
      chairR.setAttribute('class', 'svg-chair imperial-chair');
      chairsGroup.appendChild(chairR);
    }
  } else if (tableData.shape === 'circle') {
    // Round table: Evenly space chairs in a circular ring
    for (let s = 0; s < numChairs; s++) {
      const angle = (s * 2 * Math.PI) / numChairs;
      const cx = chairR * Math.cos(angle);
      const cy = chairR * Math.sin(angle);
      
      const chair = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      chair.setAttribute('cx', cx);
      chair.setAttribute('cy', cy);
      chair.setAttribute('r', 4);
      chair.setAttribute('class', 'svg-chair');
      chairsGroup.appendChild(chair);
    }
  } else {
    // Square table: Symmetrical chair distribution on four edges
    // Distribution vectors based on seating capacity
    let chairsConfig = []; // Coordinates relative to center
    const padding = 26; // Distance from table edge
    
    if (numChairs === 8) {
      // 2 chairs per side
      chairsConfig = [
        // Top Side (y = -padding)
        { x: -10, y: -padding }, { x: 10, y: -padding },
        // Bottom Side (y = padding)
        { x: -10, y: padding }, { x: 10, y: padding },
        // Left Side (x = -padding)
        { x: -padding, y: -10 }, { x: -padding, y: 10 },
        // Right Side (x = padding)
        { x: padding, y: -10 }, { x: padding, y: 10 }
      ];
    } else if (numChairs === 10) {
      // 3 chairs on Top/Bottom, 2 on Left/Right
      chairsConfig = [
        // Top Side
        { x: -14, y: -padding }, { x: 0, y: -padding }, { x: 14, y: -padding },
        // Bottom Side
        { x: -14, y: padding }, { x: 0, y: padding }, { x: 14, y: padding },
        // Left Side
        { x: -padding, y: -10 }, { x: -padding, y: 10 },
        // Right Side
        { x: padding, y: -10 }, { x: padding, y: 10 }
      ];
    } else {
      // 12 chairs (3 chairs per side)
      chairsConfig = [
        // Top Side
        { x: -14, y: -padding }, { x: 0, y: -padding }, { x: 14, y: -padding },
        // Bottom Side
        { x: -14, y: padding }, { x: 0, y: padding }, { x: 14, y: padding },
        // Left Side
        { x: -padding, y: -14 }, { x: -padding, y: 0 }, { x: -padding, y: 14 },
        // Right Side
        { x: padding, y: -14 }, { x: padding, y: 0 }, { x: padding, y: 14 }
      ];
    }
    
    chairsConfig.forEach(pos => {
      const chair = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      chair.setAttribute('x', pos.x - chairW / 2);
      chair.setAttribute('y', pos.y - chairH / 2);
      chair.setAttribute('width', chairW);
      chair.setAttribute('height', chairH);
      chair.setAttribute('rx', 1);
      chair.setAttribute('class', 'svg-chair');
      chairsGroup.appendChild(chair);
    });
  }
  
  group.appendChild(chairsGroup);
  
  // Table Number Annotation
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute('class', 'svg-label-table');
  if (tableData.shape === 'imperial') {
    label.textContent = "M.I.";
    label.setAttribute('font-size', '10');
    label.setAttribute('font-weight', 'bold');
  } else {
    label.textContent = num;
  }
  group.appendChild(label);
}

// Render all tables — only active ones
function renderAllTables() {
  const layout = layoutPositions[currentLayout];
  for (let i = 1; i <= 21; i++) {
    const group = document.getElementById(`table-group-${i}`);
    if (!group) continue;
    if (layout.activeTables.includes(i)) {
      group.style.display = 'inline';
      renderTable(i);
    } else {
      group.style.display = 'none';
    }
  }
}

// --- SELECTION & INTERACTION ---
function selectTable(num) {
  // Deselect previous
  const prevSelected = selectedTableNum;
  selectedTableNum = num;
  
  if (prevSelected) renderTable(prevSelected);
  renderTable(num); // Highlight new selection
  
  // Open Right side drawer
  detailDrawer.classList.add('open');
  
  // Close mobile sidebar if open to prevent UI clashing
  closeSidebarMobile();
  
  // Populate Drawer Fields
  const data = tablesData[num];
  drawerTitle.textContent = `Configuración: Mesa ${num}`;
  tableShapeSelect.value = data.shape;
  tableSeatsSelect.value = data.seats.toString();
  tableStatusSelect.value = data.status;
  tableGuestsTextarea.value = data.guests.join('\n');
  
  // Update guest assigned numbers
  updateGuestCountLabel(data.guests.length, data.seats);
  
  // Calculate relative distances for logistics info box
  calculateLogisticsMetrics(data);
  
  if (activeView === '3d') {
    selectElement3D(num);
  }
}

function closeDrawer() {
  detailDrawer.classList.remove('open');
  if (selectedTableNum) {
    const prev = selectedTableNum;
    selectedTableNum = null;
    renderTable(prev);
  }
  if (activeView === '3d') {
    selectElement3D(null);
  }
}

// Handle Guest Names Textarea input
function updateSelectedTableGuests(textValue) {
  if (!selectedTableNum) return;
  
  // Split input by new line, filtering empty lines
  const guestList = textValue.split('\n').map(g => g.trim()).filter(g => g.length > 0);
  tablesData[selectedTableNum].guests = guestList;
  
  // Update guest label count
  updateGuestCountLabel(guestList.length, tablesData[selectedTableNum].seats);
}

function updateGuestCountLabel(current, max) {
  guestCountLabel.textContent = `Invitados Asignados (${current} / ${max})`;
  if (current > max) {
    guestCountLabel.style.color = 'var(--danger)';
  } else {
    guestCountLabel.style.color = 'var(--text-secondary)';
  }
}

// Clear table settings
function clearSelectedTable() {
  if (!selectedTableNum) return;
  tablesData[selectedTableNum].guests = [];
  tablesData[selectedTableNum].status = 'normal';
  tableStatusSelect.value = 'normal';
  tableGuestsTextarea.value = '';
  updateGuestCountLabel(0, tablesData[selectedTableNum].seats);
  renderTable(selectedTableNum);
  updateGlobalMetrics();
  
  if (activeView === '3d') {
    syncWithData(tablesData, currentLayout, selectedTableNum);
  }
}

// Shape Customizer
function updateSelectedTableShape(shape) {
  if (!selectedTableNum) return;
  tablesData[selectedTableNum].shape = shape;
  renderTable(selectedTableNum);
  
  if (activeView === '3d') {
    syncWithData(tablesData, currentLayout, selectedTableNum);
  }
}

// Seat Capacity Customizer
function updateSelectedTableSeats(seats) {
  if (!selectedTableNum) return;
  tablesData[selectedTableNum].seats = seats;
  renderTable(selectedTableNum);
  updateGuestCountLabel(tablesData[selectedTableNum].guests.length, seats);
  updateGlobalMetrics();
  
  if (activeView === '3d') {
    syncWithData(tablesData, currentLayout, selectedTableNum);
  }
}

// Status Customizer
function updateSelectedTableStatus(status) {
  if (!selectedTableNum) return;
  tablesData[selectedTableNum].status = status;
  renderTable(selectedTableNum);
  updateGlobalMetrics();
  
  if (activeView === '3d') {
    syncWithData(tablesData, currentLayout, selectedTableNum);
  }
}

// Global Seat Density Selector
function setGlobalDensity(seats) {
  globalDensity = seats;

  document.querySelectorAll('.density-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`density-${seats}`).classList.add('active');
  document.getElementById('density-val').textContent = `${seats} personas`;

  // Apply to ALL tables (including inactive, so state is preserved)
  for (let i = 1; i <= 21; i++) {
    // Keep Mesa Imperial's capacity as 50 or custom unless user explicitly wants to overwrite it
    if (i !== 21) {
      tablesData[i].seats = seats;
    }
  }

  renderAllTables();
  updateGlobalMetrics();

  if (selectedTableNum) {
    selectTable(selectedTableNum);
  }
  
  if (activeView === '3d') {
    syncWithData(tablesData, currentLayout, selectedTableNum);
  }
}

// Calculate Dynamic Logistics details for Info Box
function calculateLogisticsMetrics(data) {
  // Static scale: 10 SVG units = 1 meter
  
  const distance = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx*dx + dy*dy) / 10; // Convert to meters
  };
  
  const df = layoutPositions[currentLayout].dancefloor;
  const dfCenterX = df.x + df.width / 2;
  const dfCenterY = df.y + df.height / 2;
  
  const distPista = distance(data.cx, data.cy, dfCenterX, dfCenterY);
  
  // Calculate distance to closest DJ stage
  let distDJ = distance(data.cx, data.cy, 485, 110); // DJ Stage 1 (top center)
  if (currentLayout === 'B') {
    const distDJ2 = distance(data.cx, data.cy, 740, 420); // DJ Stage 2 (right wall)
    distDJ = Math.min(distDJ, distDJ2);
  }
  
  const distWC = distance(data.cx, data.cy, 510, 50);
  const distBar = distance(data.cx, data.cy, 776, 140);
  
  metricDistPista.innerHTML = `Distancia a Zona de Baile: <strong>${distPista.toFixed(1)} m</strong>`;
  metricDistDJ.innerHTML = `Distancia a DJ más cercano: <strong>${distDJ.toFixed(1)} m</strong>`;
  metricDistWc.innerHTML = `Distancia a Baños: <strong>${distWC.toFixed(1)} m</strong>`;
  
  let barQuality = 'Directo & Eficiente';
  if (distBar < 12) barQuality = 'Excelente (Acceso Rápido)';
  else if (distBar > 25) barQuality = 'Estándar (Requiere pasillo despejado)';
  metricDistBar.innerHTML = `Servicio de Bar: <strong>${barQuality}</strong>`;
}

// Update live capacity dashboard in Sidebar and PDF Print Header
function updateGlobalMetrics() {
  const layout = layoutPositions[currentLayout];
  const activeTables = layout.activeTables;
  let totalCapacity = 0;

  activeTables.forEach(i => {
    totalCapacity += tablesData[i].seats;
  });

  document.getElementById('metric-capacity').textContent = totalCapacity;
  document.getElementById('metric-tables').textContent = `${activeTables.length}/${activeTables.length}`;

  // Update PDF Print Header metadata
  const pLayoutName = document.getElementById('print-layout-name');
  const pLayoutCapacity = document.getElementById('print-layout-capacity');
  if (pLayoutName) {
    pLayoutName.textContent = currentLayout === 'A'
      ? 'Versión A (Distribución Estándar con Pista Central)'
      : 'Versión B (Nueva Distribución con Mesa Imperial y 2° DJ)';
  }
  if (pLayoutCapacity) {
    pLayoutCapacity.textContent = `${totalCapacity} Comensales`;
  }
}

// --- DYNAMIC LAYER CONTROLLER ---
function toggleLayer(layer, isChecked) {
  const group = document.getElementById(`g-${layer}`);
  if (group) {
    group.style.display = isChecked ? 'inline' : 'none';
  }
}

// Toggle Circulation Paths & Anim
function toggleCirculation(pathType, isChecked) {
  const path = document.getElementById(`path-${pathType}-draw`);
  if (path) {
    if (isChecked) {
      path.classList.add('active');
    } else {
      path.classList.remove('active');
    }
  }
  
  if (activeView === '3d') {
    toggleCirculation3D(pathType, isChecked);
  }
}

// --- LAYOUT / DISTRIBUTION SWITCHER ---
function setLayout(version) {
  currentLayout = version;

  // Update sidebar button states
  document.querySelectorAll('.layout-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`layout-btn-${version}`).classList.add('active');

  const layout = layoutPositions[version];

  // Reposition all table SVG groups
  for (let i = 1; i <= 21; i++) {
    const group = document.getElementById(`table-group-${i}`);
    if (!group) continue;
    const pos = layout.tables[i];
    group.setAttribute('transform', `translate(${pos.cx}, ${pos.cy})`);
    // Update internal data coords for distance calculations
    tablesData[i].cx = pos.cx;
    tablesData[i].cy = pos.cy;
    tablesData[i].active = layout.activeTables.includes(i);
  }

  // Update dance floor SVG element
  const df = layout.dancefloor;
  const danceRect = document.querySelector('#dancefloor-group rect');
  const danceLabel = document.querySelector('#dancefloor-group text');
  if (danceRect) {
    danceRect.setAttribute('x', df.x);
    danceRect.setAttribute('y', df.y);
    danceRect.setAttribute('width', df.width);
    danceRect.setAttribute('height', df.height);
  }
  if (danceLabel) {
    danceLabel.setAttribute('x', df.labelX);
    danceLabel.setAttribute('y', df.labelY);
    if (df.labelRotate) {
      danceLabel.setAttribute('transform', `rotate(-90 ${df.labelX} ${df.labelY})`);
      danceLabel.setAttribute('font-size', '14');
    } else {
      danceLabel.removeAttribute('transform');
      danceLabel.setAttribute('font-size', '16');
    }
  }

  // Toggle DJ 2 area visibility
  const dj2 = document.getElementById('dj2-group');
  if (dj2) {
    dj2.style.display = (version === 'B') ? 'inline' : 'none';
  }

  // Update dynamic circulation paths coordinates
  const pGuest = document.getElementById('path-guest-draw');
  const pService = document.getElementById('path-service-draw');
  const pEmergency = document.getElementById('path-emergency-draw');
  if (pGuest && layout.paths) pGuest.setAttribute('d', layout.paths.guest);
  if (pService && layout.paths) pService.setAttribute('d', layout.paths.service);
  if (pEmergency && layout.paths) pEmergency.setAttribute('d', layout.paths.emergency);

  // Close drawer if open since selected table might be inactive
  if (selectedTableNum && !layout.activeTables.includes(selectedTableNum)) {
    closeDrawer();
  }

  // Re-render all tables with new positions
  renderAllTables();
  updateGlobalMetrics();
  
  if (activeView === '3d') {
    syncWithData(tablesData, currentLayout, selectedTableNum);
  }
}

// --- THEME ENGINE ---
function setTheme(theme) {
  currentTheme = theme;
  document.body.setAttribute('data-theme', theme);
  
  // Toggle sidebar active state
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`theme-${theme}`).classList.add('active');
}

// --- DYNAMIC MOUSE TOOLTIP IN DRAWING ---
const tooltip = document.getElementById('architect-tooltip');

function showTooltip(e, num) {
  if (isPanning) return;
  const data = tablesData[num];
  const numGuests = data.guests.length;
  
  tooltip.style.opacity = '1';
  tooltip.innerHTML = `
    <div style="font-weight: 700; color: var(--accent); margin-bottom: 3px;">MESA ${num} (${data.shape === 'square' ? 'Cuadrada' : 'Circular'})</div>
    <div>Sillas: <strong>${data.seats}</strong></div>
    <div>Estatus: <strong>${data.status.toUpperCase()}</strong></div>
    <div>Asignados: <strong>${numGuests} / ${data.seats}</strong></div>
  `;
  
  positionTooltip(e);
}

function positionTooltip(e) {
  const padding = 15;
  tooltip.style.left = `${e.clientX + padding}px`;
  tooltip.style.top = `${e.clientY + padding}px`;
}

function hideTooltip() {
  tooltip.style.opacity = '0';
}

// --- ZOOM & PAN CANVAS ENGINE ---
function setupCanvasInteraction() {
  const svg = document.getElementById('event-svg');
  
  // Mouse Drag Panning
  svg.addEventListener('mousedown', (e) => {
    // Only pan if we aren't clicking on an interactive table
    if (e.target.classList.contains('svg-table-block')) return;
    
    isPanning = true;
    svg.style.cursor = 'grabbing';
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    hideTooltip();
  });
  
  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    applyViewportTransform();
  });
  
  window.addEventListener('mouseup', () => {
    if (!isPanning) return;
    isPanning = false;
    svg.style.cursor = 'grab';
  });
  
  // Scroll Zoom
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = 1.05;
    if (e.deltaY < 0) {
      // Zoom In
      zoomScale = Math.min(zoomScale * zoomFactor, 4.0);
    } else {
      // Zoom Out
      zoomScale = Math.max(zoomScale / zoomFactor, 0.6);
    }
    applyViewportTransform();
  });
}

function zoomCanvas(factor) {
  zoomScale = Math.max(0.6, Math.min(zoomScale * factor, 4.0));
  applyViewportTransform();
}

function resetCanvasView() {
  zoomScale = 1.0;
  panX = 0;
  panY = 0;
  applyViewportTransform();
}

function applyViewportTransform() {
  const viewport = document.getElementById('main-viewport');
  if (viewport) {
    viewport.setAttribute('transform', `translate(${panX}, ${panY}) scale(${zoomScale})`);
  }
}

// --- MOBILE UX INTERACTIONS ---
function toggleSidebarMobile() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar) return;
  
  const isOpen = sidebar.classList.toggle('open');
  if (backdrop) {
    backdrop.classList.toggle('visible', isOpen);
  }
  
  const toggleBtn = document.getElementById('mobile-toggle-btn');
  if (toggleBtn) {
    toggleBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  }
}

function closeSidebarMobile() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('visible');
  
  const toggleBtn = document.getElementById('mobile-toggle-btn');
  if (toggleBtn) {
    toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }
}

// Bind touch swipe-to-close gesture on mobile sidebar
function setupSidebarSwipeGesture() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;
  
  sidebar.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  
  sidebar.addEventListener('touchmove', (e) => {
    endX = e.touches[0].clientX;
    endY = e.touches[0].clientY;
  }, { passive: true });
  
  sidebar.addEventListener('touchend', () => {
    const diffX = endX - startX;
    const diffY = endY - startY;
    
    // Swipe left: X coordinate decreases significantly (more than 50px)
    // Also verify it's mostly a horizontal swipe (abs(diffX) > abs(diffY))
    if (diffX < -50 && Math.abs(diffX) > Math.abs(diffY)) {
      closeSidebarMobile();
    }
    
    // Reset values
    startX = 0;
    startY = 0;
    endX = 0;
    endY = 0;
  }, { passive: true });
}

// Reset canvas zoom and pan before printing to prevent clipping in exported PDF
window.addEventListener('beforeprint', () => {
  resetCanvasView();
});

// --- NATIVE SHARING & TOAST SYSTEM (Primavera UX Extension) ---
function sharePlan() {
  const shareData = {
    title: 'Planificador de Eventos - Jardín Yolomecatl',
    text: '¡Mira la distribución interactiva de mesas y comensales en el Jardín Yolomecatl organizada con Primavera Events Group!',
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData)
      .then(() => {
        showToast('<i class="fa-solid fa-circle-check" style="color: var(--success);"></i> ¡Plano compartido con éxito!');
      })
      .catch((err) => {
        // If user cancelled, don't show clipboard toast, just print in log
        if (err.name !== 'AbortError') {
          copyLinkFallback();
        }
      });
  } else {
    copyLinkFallback();
  }
}

function copyLinkFallback() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => {
      showToast('<i class="fa-solid fa-copy" style="color: var(--accent);"></i> ¡Enlace copiado al portapapeles!');
    })
    .catch(() => {
      showToast('<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i> No se pudo copiar el enlace.');
    });
}

let toastTimeout = null;
function showToast(messageHtml) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.innerHTML = messageHtml;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// --- 3D VIEW TOGGLE ENGINE ---
let activeView = '2d';

function setViewMode(mode) {
  if (activeView === mode) return;
  activeView = mode;

  const btn2d = document.getElementById('btn-view-2d');
  const btn3d = document.getElementById('btn-view-3d');
  const container2d = document.getElementById('container-2d');
  const container3d = document.getElementById('container-3d');

  if (mode === '3d') {
    if (btn2d && btn3d && container2d && container3d) {
      btn3d.classList.add('active');
      btn2d.classList.remove('active');
      container3d.classList.add('active');
      container2d.classList.remove('active');
    }

    // Inicializar el visor 3D
    init3D(container3d, tablesData, currentLayout, selectedTableNum);
  } else {
    if (btn2d && btn3d && container2d && container3d) {
      btn2d.classList.add('active');
      btn3d.classList.remove('active');
      container2d.classList.add('active');
      container3d.classList.remove('active');
    }

    // Destruir el motor 3D y liberar memoria
    destroy3D();

    // Re-renderizar mesas 2D por si acaso
    renderAllTables();
    if (selectedTableNum) {
      selectTable(selectedTableNum);
    }
  }
}

// Exponer funciones globales al objeto window para mantener compatibilidad con inline handlers de index.html
window.closeWelcome = closeWelcome;
window.closeSidebarMobile = closeSidebarMobile;
window.toggleSidebarMobile = toggleSidebarMobile;
window.setLayout = setLayout;
window.setTheme = setTheme;
window.setGlobalDensity = setGlobalDensity;
window.sharePlan = sharePlan;
window.resetCanvasView = resetCanvasView;
window.zoomCanvas = zoomCanvas;
window.closeDrawer = closeDrawer;
window.clearSelectedTable = clearSelectedTable;
window.toggleLayer = toggleLayer;
window.toggleCirculation = toggleCirculation;
window.updateSelectedTableShape = updateSelectedTableShape;
window.updateSelectedTableSeats = updateSelectedTableSeats;
window.updateSelectedTableStatus = updateSelectedTableStatus;
window.updateSelectedTableGuests = updateSelectedTableGuests;
window.setViewMode = setViewMode;

