import React, { useState, useRef, useEffect } from 'react';
import FigureEditor from '@/components/Figures/FigureEditor';
import mockData from '@/public/data/mockData.json';
import { Figure } from '@/types/types';
import { useZoomContext } from '@/contexts/ZoomContext';
import Header from './PerimeterHeader';
import PolygonEditor from './PolygonEditor';
import Grid from '../Grid';
import { useStore } from '@/store/useStore';

type Mode = 'Perimeter' | 'Figures';

const PerimeterEditor: React.FC = () => {
  // Coordenadas iniciales del salón (en metros)
  const initialCoordinates: number[][] = mockData.salon.coordinates;

  // Inicializa las mesas usando los datos del mock.
  const [figures, setFigures] = useState<Figure[]>(() => {
    return mockData.figures.length > 0
      ? mockData.figures.map((figure, index) => ({
          id: figure.id ?? index + 1,
          name: figure.name ?? `Figure ${index + 1}`,
          shape: figure.shape === 'circle' ? 'circle' : 'rect',
          x: figure.x ?? 0,
          y: figure.y ?? 0,
          width: figure.shape === 'rect' ? figure.width ?? 2 : undefined,
          height: figure.shape === 'rect' ? figure.height ?? 1 : undefined,
          radius: figure.shape === 'circle' ? figure.radius ?? 1 : undefined,
        }))
      : [];
  });

  // Extraemos del store el perímetro y sus setters
  const { perimeter, setPerimeter } = useStore();

  // Estado para la figura del salón (inicializado con el perímetro del JSON)
  const [salonCoordinates, setSalonCoordinates] =
    useState<number[][]>(initialCoordinates);
  const [distances, setDistances] = useState<{ [key: string]: number }>({});
  const scaleRef = useRef(50); // 1 metro = 50 píxeles
  const { zoom, setZoom } = useZoomContext();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [movingVertex, setMovingVertex] = useState<number | null>(null);

  // (Opcional) Historial para undo (no se usa en este ejemplo)
  const pushHistory = (coords: number[][]) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cloned = coords.map((point) => [...point]);
  };

  // Tamaño responsivo del SVG (en píxeles)
  const [svgSize, setSvgSize] = useState({
    width: 0,
    height: 0,
  });

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setSvgSize({
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.8,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [editMode, setEditMode] = useState<Mode>('Perimeter');

  const handleSwitchMode = () => {
    setEditMode(editMode === 'Perimeter' ? 'Figures' : 'Perimeter');
  };

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

  // ---------- Funciones para el modo SALÓN ----------
  const handleVertexMouseDown = (
    index: number,
    e: React.MouseEvent<SVGCircleElement, MouseEvent>
  ) => {
    if (editMode !== 'Perimeter') return;
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

  // Agrega un vértice al hacer doble clic (proyecta sobre el segmento más cercano)
  const handleAddVertex = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (editMode !== 'Perimeter') return;
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

  const findNearestVertices = (
    _x: number,
    _y: number
  ): [number, number] | null => {
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
    if (editMode !== 'Perimeter') return;
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
    if (editMode !== 'Perimeter') return;
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
      const angle = Math.atan2(
        salonCoordinates[moveIndex][1] - yFixed,
        salonCoordinates[moveIndex][0] - xFixed
      );
      const newX = xFixed + newDistance * Math.cos(angle);
      const newY = yFixed + newDistance * Math.sin(angle);
      pushHistory(salonCoordinates);
      const updatedCoordinates = [...salonCoordinates];
      updatedCoordinates[moveIndex] = [newX, newY];
      setSalonCoordinates(updatedCoordinates);
    }
  };

  // Al guardar el salón, actualizamos el store y cambiamos a modo Figures.
  const handleSaveSalon = () => {
    setPerimeter({ ...perimeter, coordinates: salonCoordinates });
    setEditMode('Figures');
  };

  // Modo Figures: se muestra el FigureEditor, usando las figuras y el perímetro guardado en el store.
  if (editMode === 'Figures') {
    return (
      <FigureEditor
        figures={figures}
        setFigures={setFigures}
        scale={scaleRef.current}
        zoom={zoom}
        svgSize={svgSize}
        position={position}
        salonPolygon={perimeter.coordinates}
        onSwitchToPerimeter={handleSwitchMode}
        handlePanMouseDown={handlePanMouseDown}
        showGrid={false}
        onFigureSelect={() => {}}
        editable={true}
      />
    );
  }

  // Calcula límites para la cuadrícula.
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
        width: '100%',
        height: svgSize.height,
        border: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
      }}
    >
      <Header zoom={zoom} setZoom={setZoom} onSave={handleSaveSalon} />
      <main style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <div
          className="svg-container"
          style={{ width: '100%', height: '100%' }}
          onMouseDown={handlePanMouseDown}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            onDoubleClick={handleAddVertex}
            style={{ border: '1px solid #ddd', display: 'block' }}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const zoomFactor = 0.1;
              setZoom((prevZoom) =>
                Math.max(
                  0.5,
                  Math.min(
                    e.deltaY < 0
                      ? prevZoom + zoomFactor
                      : prevZoom - zoomFactor,
                    3
                  )
                )
              );
            }}
          >
            <g
              transform={`translate(${position.x}, ${position.y}) scale(${zoom})`}
            >
              <Grid
                scale={scaleRef.current}
                width={svgSize.width}
                height={svgSize.height}
                salonXs={salonXs}
                salonYs={salonYs}
              />
              {gridVerticalLines}
              {gridHorizontalLines}
              <PolygonEditor
                salonCoordinates={salonCoordinates}
                scale={scaleRef.current}
                distances={distances}
                onVertexMouseDown={handleVertexMouseDown}
                onVertexDelete={handleDeleteVertex}
                onEditDistance={handleEditDistance}
              />
            </g>
          </svg>
        </div>
      </main>
    </div>
  );
};

export default PerimeterEditor;
