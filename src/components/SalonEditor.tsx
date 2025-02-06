'use client';

import React, { useState, useRef, useEffect } from 'react';
import TableEditor from './TableEditor'; // Asegúrate de que la ruta sea correcta
import mockData from '@/public/data/mockData.json';

export type Table = {
  id: number;
  name: string;
  x: number; // posición en metros (esquina superior izquierda)
  y: number;
  width: number; // en metros
  height: number; // en metros
};

type Mode = 'salon' | 'mesas';

const SalonEditor: React.FC = () => {
  // Coordenadas iniciales del salón (en metros)
  const initialCoordinates: number[][] = mockData.salon.coordinates;

  // Estados para la figura del salón
  const [salonCoordinates, setSalonCoordinates] =
    useState<number[][]>(initialCoordinates);
  const [distances, setDistances] = useState<{ [key: string]: number }>({});
  const scaleRef = useRef(50); // 1 metro = 50 píxeles
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [movingVertex, setMovingVertex] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tables, setTables] = useState<Table[]>([]);

  // Historial para undo (cada entrada es un estado previo de salonCoordinates)
  // (Aquí se guarda una copia profunda para evitar referencias compartidas)
  const [history, setHistory] = useState<number[][][]>([]);
  const pushHistory = (coords: number[][]) => {
    const cloned = coords.map((point) => [...point]);
    setHistory((prev) => [...prev, cloned]);
  };

  // Estado para guardar la figura final del salón
  const [savedSalon, setSavedSalon] = useState<number[][] | null>(null);

  // Tamaño responsivo del SVG (en píxeles)
  const [svgSize, setSvgSize] = useState({
    width: window.innerWidth * 0.9,
    height: window.innerHeight * 0.8,
  });
  useEffect(() => {
    const handleResize = () => {
      setSvgSize({
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.8,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Actualiza las distancias entre vértices (el polígono es cerrado)
  useEffect(() => {
    const newDistances: { [key: string]: number } = {};
    for (let i = 0; i < salonCoordinates.length; i++) {
      const [x1, y1] = salonCoordinates[i];
      const [x2, y2] = salonCoordinates[(i + 1) % salonCoordinates.length];
      newDistances[`${i}-${(i + 1) % salonCoordinates.length}`] = Math.hypot(
        x2 - x1,
        y2 - y1
      );
    }
    setDistances(newDistances);
  }, [salonCoordinates]);

  // Configuración de historial para undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        setHistory((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            setSalonCoordinates(last);
            return prev.slice(0, prev.length - 1);
          }
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modo de edición: 'salon' para editar el salón, 'mesas' para agregar mesas
  const [editMode, setEditMode] = useState<Mode>('salon');

  // ---------- Funciones para el modo SALÓN ----------

  const handleVertexMouseDown = (
    index: number,
    e: React.MouseEvent<SVGCircleElement, MouseEvent>
  ) => {
    if (editMode !== 'salon') return;
    e.stopPropagation();
    setMovingVertex(index);
    const startX = e.clientX;
    const startY = e.clientY;
    const initialCoord = salonCoordinates[index];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newX = initialCoord[0] + deltaX / (scaleRef.current * zoom);
      const newY = initialCoord[1] + deltaY / (scaleRef.current * zoom);
      const updatedCoordinates = [...salonCoordinates];
      updatedCoordinates[index] = [newX, newY];
      setSalonCoordinates(updatedCoordinates);
    };

    const onMouseUp = () => {
      setMovingVertex(null);
      pushHistory(salonCoordinates);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handlePanMouseDown = (e: React.MouseEvent<Element, MouseEvent>) => {
    if (movingVertex !== null) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = { ...position };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      setPosition({ x: initialPos.x + deltaX, y: initialPos.y + deltaY });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Al hacer doble clic en el SVG se agrega un vértice (se proyecta sobre el segmento más cercano)
  const handleAddVertex = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (editMode !== 'salon') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const P = {
      x: (e.clientX - rect.left - position.x) / (scaleRef.current * zoom),
      y: (e.clientY - rect.top - position.y) / (scaleRef.current * zoom),
    };
    const nearestVertices = findNearestVertices(P.x, P.y);
    if (!nearestVertices) return;
    const [startIndex, endIndex] = nearestVertices;
    const A = {
      x: salonCoordinates[startIndex][0],
      y: salonCoordinates[startIndex][1],
    };
    const B = {
      x: salonCoordinates[endIndex][0],
      y: salonCoordinates[endIndex][1],
    };
    // Proyecta P sobre la línea AB
    const ABx = B.x - A.x;
    const ABy = B.y - A.y;
    const APx = P.x - A.x;
    const APy = P.y - A.y;
    const t = (APx * ABx + APy * ABy) / (ABx * ABx + ABy * ABy);
    const newX = A.x + t * ABx;
    const newY = A.y + t * ABy;
    pushHistory(salonCoordinates);
    const updatedCoordinates = [
      ...salonCoordinates.slice(0, endIndex),
      [newX, newY],
      ...salonCoordinates.slice(endIndex),
    ];
    setSalonCoordinates(updatedCoordinates);
  };

  // Encuentra el segmento (por índices) cuyo punto proyectado esté más cercano al punto (_x, _y)
  const findNearestVertices = (_x: number, _y: number) => {
    let nearestStartIndex = -1;
    let nearestEndIndex = -1;
    let minDistance = Infinity;
    for (let i = 0; i < salonCoordinates.length; i++) {
      const [x1, y1] = salonCoordinates[i];
      const [x2, y2] = salonCoordinates[(i + 1) % salonCoordinates.length];
      const ABx = x2 - x1;
      const ABy = y2 - y1;
      const APx = _x - x1;
      const APy = _y - y1;
      const t = (APx * ABx + APy * ABy) / (ABx * ABx + ABy * ABy);
      let closestX, closestY;
      if (t < 0) {
        closestX = x1;
        closestY = y1;
      } else if (t > 1) {
        closestX = x2;
        closestY = y2;
      } else {
        closestX = x1 + t * ABx;
        closestY = y1 + t * ABy;
      }
      const dist = Math.hypot(_x - closestX, _y - closestY);
      if (dist < minDistance) {
        minDistance = dist;
        nearestStartIndex = i;
        nearestEndIndex = (i + 1) % salonCoordinates.length;
      }
    }
    return nearestStartIndex >= 0 ? [nearestStartIndex, nearestEndIndex] : null;
  };

  const handleDeleteVertex = (
    index: number,
    e: React.MouseEvent<SVGCircleElement, MouseEvent>
  ) => {
    if (editMode !== 'salon') return;
    e.preventDefault();
    if (salonCoordinates.length > 3) {
      pushHistory(salonCoordinates);
      const updatedCoordinates = salonCoordinates.filter((_, i) => i !== index);
      setSalonCoordinates(updatedCoordinates);
      const newDistances: { [key: string]: number } = {};
      for (let i = 0; i < updatedCoordinates.length; i++) {
        const [x1, y1] = updatedCoordinates[i];
        const [x2, y2] =
          updatedCoordinates[(i + 1) % updatedCoordinates.length];
        newDistances[`${i}-${(i + 1) % updatedCoordinates.length}`] =
          Math.hypot(x2 - x1, y2 - y1);
      }
      setDistances(newDistances);
    }
  };

  const handleEditDistance = (
    index1: number,
    index2: number,
    e: React.MouseEvent<SVGTextElement, MouseEvent>
  ) => {
    if (editMode !== 'salon') return;
    e.preventDefault();
    const currentDistance = distances[`${index1}-${index2}`];
    const newDistanceStr = prompt(
      'Edit the distance (in meters):',
      currentDistance.toString()
    );
    if (newDistanceStr !== null) {
      const newDistance = parseFloat(newDistanceStr);
      const v1 = salonCoordinates[index1];
      const v2 = salonCoordinates[index2];
      let fixedIndex: number, moveIndex: number;
      // Se fija el vértice de acuerdo a: de arriba hacia abajo y, en caso de empate, de izquierda a derecha
      if (v1[1] < v2[1]) {
        fixedIndex = index1;
        moveIndex = index2;
      } else if (v1[1] > v2[1]) {
        fixedIndex = index2;
        moveIndex = index1;
      } else {
        if (v1[0] < v2[0]) {
          fixedIndex = index1;
          moveIndex = index2;
        } else {
          fixedIndex = index2;
          moveIndex = index1;
        }
      }
      const [xFixed, yFixed] = salonCoordinates[fixedIndex];
      const [xMove, yMove] = salonCoordinates[moveIndex];
      const angle = Math.atan2(yMove - yFixed, xMove - xFixed);
      const newX = xFixed + newDistance * Math.cos(angle);
      const newY = yFixed + newDistance * Math.sin(angle);
      pushHistory(salonCoordinates);
      const updatedCoordinates = [...salonCoordinates];
      updatedCoordinates[moveIndex] = [newX, newY];
      setSalonCoordinates(updatedCoordinates);
    }
  };

  // Al guardar, se almacena la figura final del salón para luego usarla como límite en el editor de mesas.
  const handleSaveSalon = () => {
    // Aquí podrías llamar a una API para guardar la figura si lo deseas.
    setSavedSalon(salonCoordinates); // Guarda el tamaño y forma final del salón.
    setEditMode('mesas');
  };

  // ---------- Renderizado ----------

  if (editMode === 'mesas') {
    return (
      <TableEditor
        tables={[]}
        setTables={() => {}}
        scale={scaleRef.current}
        zoom={zoom}
        position={position}
        svgSize={svgSize}
        salonPolygon={savedSalon} // se pasa la figura guardada del salón
        onSwitchToSalon={() => setEditMode('salon')}
        handlePanMouseDown={handlePanMouseDown}
        showGrid={false} // No se muestran las líneas de fondo en la vista final
      />
    );
  }

  // --- Cálculo de los límites de la cuadrícula ---
  const salonXs = salonCoordinates.map((c) => c[0]);
  const salonYs = salonCoordinates.map((c) => c[1]);
  const visibleMaxX = svgSize.width / scaleRef.current;
  const visibleMaxY = svgSize.height / scaleRef.current;
  const gridMinX = Math.floor(Math.min(0, ...salonXs));
  const gridMaxX = Math.ceil(Math.max(visibleMaxX, ...salonXs));
  const gridMinY = Math.floor(Math.min(0, ...salonYs));
  const gridMaxY = Math.ceil(Math.max(visibleMaxY, ...salonYs));

  const gridVerticalLines = [];
  for (let x = gridMinX; x <= gridMaxX; x++) {
    gridVerticalLines.push(
      <line
        key={`v-${x}`}
        x1={x * scaleRef.current}
        y1={gridMinY * scaleRef.current}
        x2={x * scaleRef.current}
        y2={gridMaxY * scaleRef.current}
        stroke="#ccc"
        strokeWidth="1"
      />
    );
  }
  const gridHorizontalLines = [];
  for (let y = gridMinY; y <= gridMaxY; y++) {
    gridHorizontalLines.push(
      <line
        key={`h-${y}`}
        x1={gridMinX * scaleRef.current}
        y1={y * scaleRef.current}
        x2={gridMaxX * scaleRef.current}
        y2={y * scaleRef.current}
        stroke="#ccc"
        strokeWidth="1"
      />
    );
  }

  return (
    <div
      style={{
        width: svgSize.width,
        height: svgSize.height,
        border: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
      }}
    >
      <header
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ margin: 0 }}>Salon Editor</h2>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label htmlFor="zoomRange" style={{ marginRight: '0.5rem' }}>
            Zoom:
          </label>
          <input
            id="zoomRange"
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ marginRight: '1rem' }}
          />
          <button onClick={handleSaveSalon}>
            Guardar Salón y Editar Mesas
          </button>
        </div>
      </header>
      <main style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <div
          className="svg-container"
          style={{ width: '100%', height: '100%' }}
          onMouseDown={handlePanMouseDown}
        >
          <svg
            width="100%"
            height="100%"
            onDoubleClick={handleAddVertex}
            style={{ border: '1px solid #ddd', display: 'block' }}
          >
            <g
              transform={`translate(${position.x}, ${position.y}) scale(${zoom})`}
            >
              <g>
                {gridVerticalLines}
                {gridHorizontalLines}
              </g>
              <polygon
                points={salonCoordinates
                  .map(
                    ([x, y]) =>
                      `${x * scaleRef.current},${y * scaleRef.current}`
                  )
                  .join(' ')}
                fill="lightgray"
                stroke="black"
                strokeWidth="2"
              />
              {salonCoordinates.map(([x, y], index) => (
                <g key={index}>
                  <circle
                    cx={x * scaleRef.current}
                    cy={y * scaleRef.current}
                    r="8"
                    fill="red"
                    stroke="black"
                    strokeWidth="2"
                    cursor="pointer"
                    onMouseDown={(e) => handleVertexMouseDown(index, e)}
                    onContextMenu={(e) => handleDeleteVertex(index, e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <text
                    x={x * scaleRef.current + 10}
                    y={y * scaleRef.current + 10}
                    fill="black"
                  >
                    {index + 1}
                  </text>
                </g>
              ))}
              {Object.keys(distances).map((key) => {
                const [index1, index2] = key.split('-').map(Number);
                if (
                  index1 >= salonCoordinates.length ||
                  index2 >= salonCoordinates.length
                )
                  return null;
                const [x1, y1] = salonCoordinates[index1];
                const [x2, y2] = salonCoordinates[index2];
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                return (
                  <g key={key}>
                    <line
                      x1={x1 * scaleRef.current}
                      y1={y1 * scaleRef.current}
                      x2={x2 * scaleRef.current}
                      y2={y2 * scaleRef.current}
                      stroke="black"
                      strokeWidth="2"
                    />
                    <text
                      x={midX * scaleRef.current}
                      y={midY * scaleRef.current}
                      fill="black"
                      fontSize="12"
                      textAnchor="middle"
                      onClick={(e) => handleEditDistance(index1, index2, e)}
                    >
                      {distances[key].toFixed(2)} m
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </main>
    </div>
  );
};

export default SalonEditor;
