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

  // Helper to append dynamic structural elements to the layout list
  function addStructuralElements(list, isLayoutB) {
    var structures = [
      {
        id: "struct_terrain",
        type: "terrain",
        category: "estructuras",
        name: "Terreno Base",
        x: 50.0,
        y: 49.0,
        w: 100.0,
        h: 98.0,
        rotation: 0,
        color: "#03182b",
        chairs: 0,
        editable: false,
        removable: false,
        layer: "bg"
      },
      {
        id: "struct_salon",
        type: "salon",
        category: "estructuras",
        name: "Salón Principal",
        x: 51.0,
        y: 39.0,
        w: 48.0,
        h: 62.0,
        rotation: 0,
        color: "#1e293b",
        chairs: 0,
        editable: true,
        removable: true,
        layer: "estructuras",
        salonType: "muros"
      },
      {
        id: "struct_dancefloor",
        type: "dancefloor_pixel",
        category: "entretenimiento",
        name: "Pista de Baile",
        x: isLayoutB ? 54.0 : 48.5,
        y: isLayoutB ? 42.0 : 21.5,
        w: isLayoutB ? 38.0 : 20.0,
        h: isLayoutB ? 8.0 : 13.0,
        rotation: 0,
        color: "#0f172a",
        chairs: 0,
        editable: true,
        removable: true,
        layer: "entretenimiento"
      },
      {
        id: "struct_stage",
        type: "stage",
        category: "entretenimiento",
        name: "Escenario / Templete",
        x: 48.5,
        y: 11.0,
        w: 20.0,
        h: 6.0,
        rotation: 0,
        color: "#5c3d2e",
        chairs: 0,
        editable: true,
        removable: true,
        layer: "entretenimiento"
      },
      {
        id: "struct_dj",
        type: "dj_booth",
        category: "entretenimiento",
        name: "Cabina DJ",
        x: 48.5,
        y: 9.0,
        w: 4.0,
        h: 2.0,
        rotation: 0,
        color: "#1e293b",
        chairs: 0,
        editable: true,
        removable: true,
        layer: "entretenimiento"
      },
      {
        id: "struct_bathrooms",
        type: "bathrooms",
        category: "estructuras",
        name: "Servicios Sanitarios",
        x: 51.0,
        y: 5.0,
        w: 20.0,
        h: 6.0,
        rotation: 0,
        color: "#374151",
        chairs: 0,
        editable: true,
        removable: true,
        layer: "estructuras"
      },
      {
        id: "struct_pool",
        type: "pool",
        category: "estructuras",
        name: "Alberca",
        x: 51.5,
        y: 86.0,
        w: 25.8,
        h: 11.8,
        rotation: 0,
        color: "#0369a1",
        chairs: 0,
        editable: true,
        removable: true,
        layer: "estructuras"
      },
      {
        id: "struct_chapel",
        type: "chapel",
        category: "estructuras",
        name: "Capilla",
        x: 12.5,
        y: 86.0,
        w: 17.0,
        h: 12.0,
        rotation: 0,
        color: "#475569",
        chairs: 0,
        editable: true,
        removable: true,
        layer: "estructuras"
      },
      {
        id: "struct_parking",
        type: "parking",
        category: "estructuras",
        name: "Estacionamiento",
        x: 87.5,
        y: 60.5,
        w: 21.0,
        h: 67.0,
        rotation: 0,
        color: "#27272a",
        chairs: 0,
        editable: true,
        removable: true,
        layer: "estructuras"
      },
      {
        id: "struct_waterfall",
        type: "waterfall",
        category: "estructuras",
        name: "Cascada",
        x: 4.0,
        y: 32.0,
        w: 3.0,
        h: 25.0,
        rotation: 0,
        color: "#334155",
        chairs: 0,
        editable: true,
        removable: true,
        layer: "estructuras"
      },
      {
        id: "struct_lobby",
        type: "lobby_reception",
        category: "estructuras",
        name: "Lobby / Recepción",
        x: 51.0,
        y: 72.75,
        w: 48.0,
        h: 5.5,
        rotation: 0,
        color: "#e4e4e7",
        chairs: 0,
        editable: true,
        removable: true,
        layer: "estructuras"
      },
      {
        id: "struct_kitchen",
        type: "kitchen",
        category: "estructuras",
        name: "Cocina y Barra",
        x: 87.5,
        y: 13.5,
        w: 21.0,
        h: 23.0,
        rotation: 0,
        color: "#092135",
        chairs: 0,
        editable: true,
        removable: true,
        layer: "estructuras"
      }
    ];

    structures.forEach(function (struct) {
      list.push(struct);
    });
  }

  // --- LAYOUT A (Pista Central - 21 mesas cuadradas + estructuras) ---
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
  addStructuralElements(elementsA, false);

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

  // --- LAYOUT B (Pista Longitudinal - 22 mesas + estructuras) ---
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
  addStructuralElements(elementsB, true);

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
