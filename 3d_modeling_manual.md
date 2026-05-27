# Manual de Especificaciones Técnicas para Modelado y Renderizado 3D: Salón Yolomecatl

Este manual ha sido diseñado por un arquitecto y especialista en modelado 3D para servir de guía definitiva en la reconstrucción tridimensional del **Salón de Eventos Yolomecatl y sus Jardines**. Contiene las coordenadas exactas basadas en el plano CAD del proyecto, alturas del eje Z, materialidad detallada, esquemas de iluminación y configuraciones de renderizado para motores como Blender (Cycles), 3ds Max (V-Ray/Corona) o Unreal Engine 5.

---

## 1. Configuración de Escala y Entorno 3D

Para garantizar la precisión milimétrica del modelo, configura tu software de modelado (Blender, SketchUp, 3ds Max o AutoCAD 3D) con los siguientes parámetros:

*   **Sistema de Unidades:** Métrico.
*   **Unidad Base:** Metros (1.0 = 1.0 m).
*   **Escala de Importación del Plano 2D (SVG):**
    *   La relación nativa del plano es **10 unidades de coordenadas = 1.0 metro** (es decir, una distancia de 100 unidades en el archivo SVG equivale a 10.0 metros reales).
    *   **Punto de Origen Global (0, 0, 0):** Esquina superior izquierda del plano general de la propiedad.
    *   **Dimensiones Totales del Terreno (Límite de Propiedad):** 100.0 m (Ancho - Eje X) × 98.0 m (Largo - Eje Y).

---

## 2. Especificación de Estructuras y Alturas (Eje Z)

El plano interactivo proporciona las dimensiones horizontales (X, Y). A continuación, se detallan las elevaciones y espesores verticales (Z) necesarias para levantar la volumetría tridimensional:

### A. Muros Perimetrales y Estructurales (Salón de Eventos)
*   **Coordenadas Horizontales (Caja 2D):**
    *   Esquina superior izquierda: `X: 270, Y: 80` (27.0 m, 8.0 m)
    *   Esquina inferior derecha: `X: 750, Y: 700` (75.0 m, 70.0 m)
    *   Dimensiones: Ancho `48.0 m` × Largo `62.0 m`
*   **Altura de Muros del Salón (Z):** `6.50 m` (Construcción de doble altura para alojar vigas y candelabros).
*   **Espesor de Muros:** `0.30 m` (Muros de carga perimetrales).
*   **Columnas Interiores de Soporte (CAD columns):**
    *   Sección horizontal: `0.50 m` × `0.75 m` (Sobresalen `0.10 m` del plano interior del muro).
    *   Ubicaciones X en la pared izquierda: `X = 265` a intervalos de Y: `195, 315, 435, 555`.
    *   Ubicaciones X en la pared derecha: `X = 745` a intervalos de Y: `195, 315, 435, 555`.
    *   Altura (Z): `6.50 m` (Conectan con cerramientos superiores).

### B. Escenario DJ (Nivel Elevado)
*   **Caja 2D:** `X: 385 a 585` (Ancho: 20.0 m) | `Y: 80 a 140` (Fondo: 6.0 m).
*   **Altura de Plataforma (Z):** `+0.60 m` sobre el nivel del suelo principal.
*   **Detalle Estructural:** Relleno sólido. Fachada frontal con acabado en madera lacada y zoclo de luz LED indirecta.
*   **Escaleras de Acceso (Laterales):**
    *   Escalera Izquierda: `X: 345 a 380` | Escalera Derecha: `X: 590 a 625`.
    *   Detalle técnica: 3 peldaños de `0.20 m` de huella y `0.20 m` de peralte para salvar la altura de `0.60 m`.

### C. Techo y Cubierta del Salón
*   **Estructura:** Armadura de dos aguas con vigas de acero expuestas o vigas de madera rústica oscura.
*   **Altura al Apoyo de Viga (Z):** `6.50 m`.
*   **Altura a la Cumbrera Central (Punto más alto, Z):** `8.20 m` (Dirección del eje Y central a `X: 510`).

---

## 3. Áreas de Servicio y Exteriores (Jardín y Amenidades)

### A. Cocina y Barra (Esquina Superior Derecha)
*   **Caja Cocina:** `X: 770 a 980` (Ancho: 21.0 m) | `Y: 20 a 250` (Largo: 23.0 m).
*   **Altura de Muros (Z):** `3.50 m`.
*   **Integrated Bar (Barra de Cocina en Corredor):**
    *   Ubicación: `X: 770 a 782`, `Y: 95 a 185`.
    *   Dimensiones del mostrador: Ancho `1.20 m` | Altura (Z) `1.10 m` (Estándar de bar).
    *   Material: Cubierta de mármol negro con cuerpo de madera de nogal cepillada.

### B. Baños (Restrooms - Centro Superior)
*   **Caja Baños:** `X: 410 a 610` (Ancho: 20.0 m) | `Y: 20 a 80` (Largo: 6.0 m).
*   **Altura de Muros (Z):** `3.00 m`.

### C. Recepción Principal (Lobby Horizontal)
*   **Caja Lobby:** `X: 270 a 750` (Ancho: 48.0 m) | `Y: 700 a 755` (Largo: 5.5 m).
*   **Lobby Pasillo Peatonal:** `X: 270 a 750` | `Y: 755 a 785`.
*   **Altura de Recepción (Z):** `3.20 m` (Falso plafón decorativo con cajillos de luz).

### D. Alberca (Jardín 2)
*   **Caja Alberca:** `X: 390 a 640` (Ancho: 25.0 m) | `Y: 805 a 915` (Largo: 11.0 m).
*   **Profundidad (Eje Z Negativo):**
    *   Zona de niños / Escaleras (Derecha): `-0.60 m`.
    *   Zona profunda (Izquierda): `-1.60 m` (Rampa de transición suave).
*   **Espesor del Borde de Alberca (Cordonería):** `0.40 m` perimetral en mármol blanco antiderrapante, elevado `+0.05 m` sobre el césped.

### E. Capilla (Jardín Esquina Inferior Izquierda)
*   **Caja Capilla:** `X: 40 a 210` (Ancho: 17.0 m) | `Y: 800 a 920` (Largo: 12.0 m).
*   **Estructura Visual:** Estructura abierta tipo pabellón con columnas de piedra de cantera y techo de teja a dos aguas.
*   **Altura de Columnas (Z):** `3.20 m` | **Altura de Cumbrera (Z):** `4.50 m`.
*   **Altar Principal (Muro Izquierdo):** Mesa de piedra maciza blanca (`1.80 m` de largo, `0.90 m` de alto, `0.60 m` de profundidad).

### F. Cascada de Agua (Waterfall Wall)
*   **Caja Alberca de Cascada:** `X: 25 a 55` (Ancho: 3.0 m) | `Y: 195 a 445` (Largo: 25.0 m).
*   **Muro de Piedra (Emisor de Cascada):**
    *   Ubicación: `X: 20 a 35`, `Y: 200 a 440`.
    *   Altura (Z): `4.00 m` (Muro vertical revestido de laja de piedra volcánica negra texturizada).
    *   Profundidad de la pileta (Z): `-0.40 m`.

---

## 4. Mobiliario Técnico: Mesas y Sillas

Para recrear las mesas del planificador 3D con precisión ergonómica, aplica los siguientes planos de modelado:

### A. Mesa Cuadrada Estándar (Comensales: 8, 10 o 12)
*   **Tamaño del Tablero:** `1.60 m` × `1.60 m` (Representado por el cuadrado SVG de `42` unidades de lado).
*   **Altura de la Mesa (Z):** `0.75 m`.
*   **Sillas (Modelado de Sillas Avant Garde / Tiffany):**
    *   Dimensiones del asiento: `0.42 m` × `0.42 m`. Altura del asiento (Z): `0.45 m` | Altura del respaldo (Z): `0.90 m`.
    *   **Distancia de Colocación:** Separadas `0.10 m` del borde del tablero.

### B. Mesa Imperial Especial (Mesa 21 - Eje de Pista)
*   **Dimensiones del Tablero:** Ancho `2.20 m` × Largo `48.0 m` (Modelado a partir de rectángulos modulares continuos en `X: 294 a 316` | `Y: 160 a 640`).
*   **Altura de la Mesa (Z):** `0.75 m`.
*   **Capacidad de Sillas:** 50 comensales distribuidos simétricamente a los costados y extremos (paso ergonómico de `0.75 m` entre centros de comensal).

---

## 5. Tabla de Materiales e Texturizado (V-Ray / PBR Shader Setup)

Utiliza mapas PBR (Albedo, Roughness, Metallic, Normal) de alta resolución con las siguientes propiedades para simular el ecosistema premium de **Primavera Events**:

| Estructura / Área | Material Sugerido | Propiedades de Shader PBR | Acabado Visual |
| :--- | :--- | :--- | :--- |
| **Piso del Salón** | Parquet de Madera Noble Oscura | *Roughness:* 0.35 \| *Refraction:* 0.05 \| *Normal map:* Vetas lineales suaves | Barniz semibrillante, reflejo elegante de las luces aéreas |
| **Área de Baile (Pista)** | Mármol Pulido Blanco / Negro Geométrico | *Specular:* 0.9 \| *Roughness:* 0.1 (Altamente pulido) | Reflejo espejo nítido con costuras invisibles |
| **Muros del Salón** | Estuco Liso Blanco Roto / Navy Mate | *Roughness:* 0.85 (Difuso) \| *Bump:* Textura micro-porosa | Absorción de luz suave para destacar la iluminación decorativa |
| **Muro de la Cascada** | Laja de Piedra de Río / Basalto Hidrófugo | *Roughness:* 0.25 (Efecto mojado) \| *Normal:* Relieve profundo | Piedra negra mate con destellos brillantes por el agua en movimiento |
| **Piso del Jardín** | Césped Denso (Particle System) | *Hair length:* 0.04 m \| *Density:* Alta \| *Color:* Verde pino/bosque profundo | Terreno verde tupido y orgánico |
| **Agua (Alberca / Cascada)** | Líquido Transparente Dinámico | *Index of Refraction (IOR):* 1.333 \| *Transmission:* 100% (Celeste claro) | Ondas suaves por generador de ruido |
| **Mostradores y Barras** | Mármol Arabescato y Madera Nogal | *Roughness Mármol:* 0.15 \| *Roughness Madera:* 0.45 | Contraste de lujo clásico |

---

## 6. Iluminación y Render (Ecosistema Lumínico Nocturno)

Para lograr renders que emitan el ambiente premium que caracteriza a Primavera Events Group, se recomienda un esquema de **iluminación nocturna de gala**:

1.  **Luz Ambiental (HDRI):**
    *   Utiliza un mapa de iluminación exterior tipo *Sunset* tardío o *Night Blue* (Azul noche profundo).
    *   Intensidad baja para permitir que la iluminación artificial domine el render.
2.  **Candelabros Colgantes (Techo del Salón):**
    *   Instala 6 candelabros de cristal colgando a `Z: 4.80 m` espaciados uniformemente a lo largo del eje central del salón (`X: 510`).
    *   **Fuente:** Luces de punto de color cálido (`2700K` a `3000K`) con caída física inversa del cuadrado.
3.  **Iluminación Perimetral de Acento (Uplights en Muros):**
    *   Coloca luces tipo *Spot* IES en la base de cada columna interior apuntando verticalmente hacia arriba.
    *   **Color:** Rosa Coral Primavera (`#F05A7E`) a baja intensidad para bañar las columnas con el color de marca de la empresa.
4.  **Iluminación Sumergida en Alberca:**
    *   Instala luces de área subacuáticas integradas a los costados del vaso de la alberca a `Z: -0.20 m`.
    *   **Color:** Azul cian suave (`#00f0ff`) con alta intensidad difusa para generar el efecto de refracción en las ondas del agua.
5.  **Configuración de Cámara en Renderizador:**
    *   **Longitud Focal:** `24 mm` (Gran angular para tomas interiores dramáticas del salón) o `50 mm` (Tomas de detalle de las mesas).
    *   **Profundidad de Campo (Depth of Field):** Enfocar en la mesa principal (Mesa Imperial 21), con un diafragma abierto (`f/2.8` o `f/4`) para difuminar suavemente el fondo del jardín y las luces de las velas en el fondo (efecto *bokeh*).
