import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Figure, FigureEditorProps } from '@/types/types';
import { useStore } from '@/store/useStore';
import mockData from '@/public/data/mockData.json';
import ReservationModal from '@/components/ReservationModal';

// Se carga FigureEditor de forma dinámica, extendiendo sus props con onFigureSelect y editable
const FigureEditor = dynamic<
  FigureEditorProps & {
    onFigureSelect: (figure: Figure) => void;
    editable?: boolean;
  }
>(() => import('@/components/Figures/FigureEditor'), { ssr: false });

const Home: React.FC = () => {
  const [figures, setFigures] = useState<Figure[]>(() =>
    mockData.figures.map((figure, index) => ({
      id: figure.id ?? index + 1,
      name: figure.name ?? `Figure ${index + 1}`,
      shape: figure.shape as 'rect' | 'circle',
      x: figure.x ?? 0,
      y: figure.y ?? 0,
      width: figure.shape === 'rect' ? figure.width ?? 2 : undefined,
      height: figure.shape === 'rect' ? figure.height ?? 1 : undefined,
      radius: figure.shape === 'circle' ? figure.radius ?? 1 : undefined,
    }))
  );

  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [zoom, setZoom] = useState<number>(1);
  const [svgSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  const { perimeter } = useStore();

  // Estado para el modal de reservas
  const [selectedFigure, setSelectedFigure] = useState<Figure | null>(null);

  const handleReserve = (selectedOptionIds: number[]) => {
    console.log(
      'Reservando la figura',
      selectedFigure,
      'con las opciones:',
      selectedOptionIds
    );
  };

  const onSwitchToPerimeter = (): void => {
    console.log('Switch to perimeter');
  };

  const handlePanMouseDown = (
    e: React.MouseEvent<Element, MouseEvent>
  ): void => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...position };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      setPosition({
        x: startPos.x + deltaX,
        y: startPos.y + deltaY,
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleFigureSelect = (figure: Figure): void => {
    setSelectedFigure(figure);
  };

  const handleCloseModal = (): void => {
    setSelectedFigure(null);
  };

  const scaleFactor = 50;

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Perimeter with Figures & Reservations</h1>

      {/* Botones y otros controles en un contenedor con z-index mayor */}
      <div style={{ marginTop: '1rem', position: 'relative', zIndex: 10 }}>
        {selectedFigure && (
          <ReservationModal
            selectedFigure={selectedFigure}
            onClose={handleCloseModal}
            onReserve={handleReserve}
          />
        )}
      </div>

      {/* Contenedor del mapa (con z-index menor) */}
      <div
        style={{
          width: '100%',
          height: '90vh',
          border: '1px solid #ccc',
          position: 'relative',
          overflow: 'auto',
          zIndex: 1,
        }}
      >
        <FigureEditor
          figures={figures}
          setFigures={setFigures}
          scale={scaleFactor}
          zoom={zoom}
          svgSize={svgSize}
          position={position}
          salonPolygon={perimeter.coordinates}
          onSwitchToPerimeter={onSwitchToPerimeter}
          handlePanMouseDown={handlePanMouseDown}
          showGrid={false}
          onFigureSelect={handleFigureSelect}
          editable={false}
        />
      </div>
    </div>
  );
};

export default Home;
