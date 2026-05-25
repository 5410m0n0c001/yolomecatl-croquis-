/**
 * Yolomecatl - Planificador y Visualizador de Eventos
 * Technical CAD Interactivity & Render Engine
 */

// --- STATE MANAGEMENT ---
let currentTheme = 'premium';
let globalDensity = 10;
let selectedTableNum = null;
let zoomScale = 1.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX = 0;
let startY = 0;

// Central coordinates for each table inside the SVG (1000x800 viewBox)
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
  20: { cx: 650, cy: 175 }
};

// Initialize Table Data
const tablesData = {};
for (let i = 1; i <= 20; i++) {
  tablesData[i] = {
    number: i,
    shape: 'square', // Defaulting to Square Tables as requested by user
    seats: 10,       // Default seats
    status: 'normal',// standard status
    guests: [],      // Empty guest list
    cx: tablePositions[i].cx,
    cy: tablePositions[i].cy
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
  
  if (tableData.shape === 'square') {
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
  
  if (tableData.shape === 'circle') {
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
  label.textContent = num;
  group.appendChild(label);
}

// Render all tables in the event salon
function renderAllTables() {
  for (let i = 1; i <= 20; i++) {
    renderTable(i);
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
}

function closeDrawer() {
  detailDrawer.classList.remove('open');
  if (selectedTableNum) {
    const prev = selectedTableNum;
    selectedTableNum = null;
    renderTable(prev);
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
}

// Shape Customizer
function updateSelectedTableShape(shape) {
  if (!selectedTableNum) return;
  tablesData[selectedTableNum].shape = shape;
  renderTable(selectedTableNum);
}

// Seat Capacity Customizer
function updateSelectedTableSeats(seats) {
  if (!selectedTableNum) return;
  tablesData[selectedTableNum].seats = seats;
  renderTable(selectedTableNum);
  updateGuestCountLabel(tablesData[selectedTableNum].guests.length, seats);
  updateGlobalMetrics();
}

// Status Customizer
function updateSelectedTableStatus(status) {
  if (!selectedTableNum) return;
  tablesData[selectedTableNum].status = status;
  renderTable(selectedTableNum);
  updateGlobalMetrics();
}

// Global Seat Density Selector
function setGlobalDensity(seats) {
  globalDensity = seats;
  
  // Toggle Active Class in Sidebar Buttons
  document.querySelectorAll('.density-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`density-${seats}`).classList.add('active');
  document.getElementById('density-val').textContent = `${seats} personas`;
  
  // Apply globally to all tables
  for (let i = 1; i <= 20; i++) {
    tablesData[i].seats = seats;
  }
  
  renderAllTables();
  updateGlobalMetrics();
  
  if (selectedTableNum) {
    selectTable(selectedTableNum); // Refresh drawer counts
  }
}

// Calculate Dynamic Logistics details for Info Box
function calculateLogisticsMetrics(data) {
  // Static scale: 10 SVG units = 1 meter
  // Coordinates critical points:
  // Pista center: (510, 220)
  // DJ stage center: (510, 110)
  // Restrooms center: (510, 50)
  // Kitchen Bar: (720, 220)
  
  const distance = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx*dx + dy*dy) / 10; // Convert to meters
  };
  
  const distPista = distance(data.cx, data.cy, 510, 220);
  const distDJ = distance(data.cx, data.cy, 510, 110);
  const distWC = distance(data.cx, data.cy, 510, 50);
  const distBar = distance(data.cx, data.cy, 720, 220);
  
  metricDistPista.innerHTML = `Distancia a Pista: <strong>${distPista.toFixed(1)} m</strong>`;
  metricDistDJ.innerHTML = `Distancia a DJ: <strong>${distDJ.toFixed(1)} m</strong>`;
  metricDistWc.innerHTML = `Distancia a Baños: <strong>${distWC.toFixed(1)} m</strong>`;
  
  let barQuality = 'Directo & Eficiente';
  if (distBar < 12) barQuality = 'Excelente (Acceso Rápido)';
  else if (distBar > 25) barQuality = 'Estándar (Requiere pasillo despejado)';
  metricDistBar.innerHTML = `Servicio de Bar: <strong>${barQuality}</strong>`;
}

// Update live capacity dashboard in Sidebar
function updateGlobalMetrics() {
  let totalCapacity = 0;
  let activeTablesCount = 0;
  
  for (let i = 1; i <= 20; i++) {
    totalCapacity += tablesData[i].seats;
    activeTablesCount++;
  }
  
  document.getElementById('metric-capacity').textContent = totalCapacity;
  document.getElementById('metric-tables').textContent = `${activeTablesCount}/20`;
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
