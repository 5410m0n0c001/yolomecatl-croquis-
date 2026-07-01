// ============================================================
// default-layout.js — Predefined Layouts A & B for Yolomecatl
// Primavera Events Group
// ============================================================

(function () {
  'use strict';

  // Helper to generate square tables
  function makeSquareTable(idNum, mesaNum, x, y) {
    return {
      id: "table_" + idNum,
      type: "table_square",
      category: "mobiliario",
      name: "Mesa " + mesaNum,
      x: x,
      y: y,
      w: 1.6,
      h: 1.6,
      rotation: 0,
      color: "#92400e",
      chairs: 10,
      editable: true,
      removable: true,
      layer: "mobiliario",
      mesaConfig: {
        mesaNum: mesaNum,
        capacidadMax: 10,
        mantelColor: "blanco",
        caminoColor: "ninguno",
        tipoSilla: "tiffany",
        invitados: []
      }
    };
  }

  // --- LAYOUT A (Pista Central - 21 mesas cuadradas) ---
  var elementsA = [];
  var coordsA = {
    1: { x: 32.0, y: 64.7 }, 2: { x: 43.0, y: 64.7 },
    3: { x: 54.0, y: 64.7 }, 4: { x: 65.0, y: 64.7 },
    5: { x: 32.0, y: 54.9 }, 6: { x: 43.0, y: 54.9 },
    7: { x: 54.0, y: 54.9 }, 8: { x: 65.0, y: 54.9 },
    9: { x: 32.0, y: 45.1 }, 10: { x: 43.0, y: 45.1 },
    11: { x: 54.0, y: 45.1 }, 12: { x: 65.0, y: 45.1 },
    13: { x: 32.0, y: 35.3 }, 14: { x: 43.0, y: 35.3 },
    15: { x: 54.0, y: 35.3 }, 16: { x: 65.0, y: 35.3 },
    17: { x: 32.0, y: 25.5 }, 18: { x: 32.0, y: 30.4 },
    19: { x: 43.0, y: 40.2 }, 20: { x: 54.0, y: 40.2 },
    21: { x: 65.0, y: 40.2 }
  };
  
  for (var num = 1; num <= 21; num++) {
    var pos = coordsA[num];
    elementsA.push(makeSquareTable(num, num, pos.x, pos.y));
  }

  window.LAYOUT_A = {
    elements: elementsA,
    layers: {
      estructuras: true,
      techos: false,
      accesos: true,
      mobiliario: true,
      entretenimiento: true,
      decoracion: true,
      proveedores: true,
      flujo_invitados: true,
      flujo_proveedores: true,
      flujo_staff: true
    }
  };

  // --- LAYOUT B (Pista Longitudinal - 22 mesas: 21 cuadradas + 1 Imperial) ---
  var elementsB = [];
  var coordsB = {
    1: { x: 41.0, y: 19.0 }, 2: { x: 41.0, y: 26.5 }, 3: { x: 41.0, y: 34.0 },
    4: { x: 52.0, y: 19.0 }, 5: { x: 52.0, y: 26.5 }, 6: { x: 52.0, y: 34.0 },
    7: { x: 63.0, y: 19.0 }, 8: { x: 63.0, y: 26.5 }, 9: { x: 63.0, y: 34.0 },
    10: { x: 41.0, y: 51.5 }, 11: { x: 41.0, y: 61.5 },
    12: { x: 49.0, y: 51.5 }, 13: { x: 49.0, y: 61.5 },
    14: { x: 57.0, y: 51.5 }, 15: { x: 57.0, y: 61.5 },
    16: { x: 65.0, y: 51.5 }, 17: { x: 65.0, y: 61.5 },
    18: { x: 41.0, y: 56.5 }, 19: { x: 49.0, y: 56.5 },
    20: { x: 57.0, y: 56.5 }, 21: { x: 65.0, y: 56.5 }
  };

  for (var num = 1; num <= 21; num++) {
    var pos = coordsB[num];
    elementsB.push(makeSquareTable(num, num, pos.x, pos.y));
  }

  // Table 22: Mesa Imperial
  elementsB.push({
    id: "table_22",
    type: "table_imperial",
    category: "mobiliario",
    name: "Mesa Imperial 22",
    x: 30.5,
    y: 40.0,
    w: 2.2,
    h: 48.0,
    rotation: 0,
    color: "#5c3d2e",
    chairs: 50,
    editable: true,
    removable: true,
    layer: "mobiliario",
    mesaConfig: {
      mesaNum: 22,
      capacidadMax: 50,
      mantelColor: "blanco",
      caminoColor: "ninguno",
      tipoSilla: "tiffany",
      invitados: []
    }
  });

  window.LAYOUT_B = {
    elements: elementsB,
    layers: {
      estructuras: true,
      techos: false,
      accesos: true,
      mobiliario: true,
      entretenimiento: true,
      decoracion: true,
      proveedores: true,
      flujo_invitados: true,
      flujo_proveedores: true,
      flujo_staff: true
    }
  };

  // Set default
  window.DEFAULT_LAYOUT = window.LAYOUT_A;
})();
