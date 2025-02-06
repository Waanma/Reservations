'use client';

import React, { useState } from 'react';
import { Table } from './SalonEditor';

interface TableEditorProps {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  scale: number;
  zoom: number;
  position: { x: number; y: number };
  svgSize: { width: number; height: number };
  salonPolygon: number[][] | null;
  onSwitchToSalon: () => void;
  handlePanMouseDown: (e: React.MouseEvent<Element, MouseEvent>) => void;
  showGrid?: boolean; // nueva propiedad opcional
}

const TableEditor: React.FC<TableEditorProps> = ({
  tables,
  setTables,
  scale,
  zoom,
  position,
  svgSize,
  salonPolygon,
  onSwitchToSalon,
  handlePanMouseDown,
  showGrid,
}) => {
  const [movingTableIndex, setMovingTableIndex] = useState<number | null>(null);
  // Estado para controlar si estamos en Modo Edición
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };

  // Solo se permite agregar mesas en modo edición
  const handleAddTable = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isEditing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - position.x) / (scale * zoom);
    const y = (e.clientY - rect.top - position.y) / (scale * zoom);
    const newTable: Table = {
      id: Date.now(),
      name: `Mesa ${tables.length + 1}`,
      x,
      y,
      width: 2,
      height: 1,
    };
    setTables([...tables, newTable]);
  };

  const handleTableMouseDown = (
    index: number,
    e: React.MouseEvent<SVGRectElement, MouseEvent>
  ) => {
    e.stopPropagation();
    setMovingTableIndex(index);
    const startX = e.clientX;
    const startY = e.clientY;
    const initialTable = tables[index];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newX = initialTable.x + deltaX / (scale * zoom);
      const newY = initialTable.y + deltaY / (scale * zoom);
      const updatedTables = [...tables];
      updatedTables[index] = { ...updatedTables[index], x: newX, y: newY };
      setTables(updatedTables);
    };

    const onMouseUp = () => {
      setMovingTableIndex(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Edición del nombre y dimensiones (se activa al hacer doble clic sobre el texto)
  const handleEditTable = (
    index: number,
    e: React.MouseEvent<SVGTextElement, MouseEvent>
  ) => {
    e.stopPropagation();
    // Solo permitimos editar si estamos en modo edición
    if (!isEditing) return;
    const table = tables[index];
    const newName = prompt('Ingrese el nuevo nombre:', table.name);
    if (newName === null) return;
    const newWidthStr = prompt('Ingrese el ancho (m):', table.width.toString());
    const newHeightStr = prompt(
      'Ingrese el alto (m):',
      table.height.toString()
    );
    if (newWidthStr === null || newHeightStr === null) return;
    const newWidth = parseFloat(newWidthStr);
    const newHeight = parseFloat(newHeightStr);
    const updatedTables = [...tables];
    updatedTables[index] = {
      ...table,
      name: newName,
      width: newWidth,
      height: newHeight,
    };
    setTables(updatedTables);
  };

  // Nueva función para eliminar una mesa
  const handleDeleteTable = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar esta mesa?')) {
      const updatedTables = tables.filter((_, i) => i !== index);
      setTables(updatedTables);
    }
  };

  // Fondo cuadriculado para el editor de mesas
  // Dentro de TableEditor, antes de renderizar el SVG:
  const gridVerticalLines = Array.from({
    length: Math.ceil(svgSize.width / scale),
  }).map((_, i) => (
    <line
      key={`v-${i}`}
      x1={i * scale}
      y1={0}
      x2={i * scale}
      y2={svgSize.height}
      stroke="#ccc"
      strokeWidth="1"
    />
  ));

  const gridHorizontalLines = Array.from({
    length: Math.ceil(svgSize.height / scale),
  }).map((_, i) => (
    <line
      key={`h-${i}`}
      x1={0}
      y1={i * scale}
      x2={svgSize.width}
      y2={i * scale}
      stroke="#ccc"
      strokeWidth="1"
    />
  ));

  return (
    <div>
      <div style={{ margin: '0.5rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={toggleEditMode}>
          {isEditing ? 'Salir de Modo Edición' : 'Entrar en Modo Edición'}
        </button>
        <button onClick={onSwitchToSalon}>Volver a Modo Salón</button>
      </div>
      <svg
        width={svgSize.width}
        height={svgSize.height}
        onDoubleClick={handleAddTable}
        style={{
          border: '1px solid #ddd',
          cursor: isEditing ? 'crosshair' : 'default',
        }}
        onMouseDown={handlePanMouseDown}
      >
        <g transform={`translate(${position.x}, ${position.y}) scale(${zoom})`}>
          {/* Renderiza la cuadrícula solo si showGrid es true */}
          {showGrid && (
            <g>
              {gridVerticalLines}
              {gridHorizontalLines}
            </g>
          )}
          {/* Se muestra la figura guardada del salón (únicamente el polígono) */}
          {salonPolygon && (
            <polygon
              points={salonPolygon
                .map(([x, y]) => `${x * scale},${y * scale}`)
                .join(' ')}
              fill="lightgray"
              stroke="black"
              strokeWidth="2"
            />
          )}
          {tables.map((table, index) => (
            <g key={table.id}>
              <rect
                x={table.x * scale}
                y={table.y * scale}
                width={table.width * scale}
                height={table.height * scale}
                fill="rgba(0, 0, 255, 0.3)"
                stroke="blue"
                strokeWidth="2"
                cursor="move"
                onMouseDown={(e) => handleTableMouseDown(index, e)}
              />
              <text
                x={(table.x + table.width / 2) * scale}
                y={(table.y + table.height / 2) * scale}
                fill="black"
                fontSize="12"
                textAnchor="middle"
                onDoubleClick={(e) => handleEditTable(index, e)}
                style={{ userSelect: 'none', pointerEvents: 'all' }}
              >
                {table.id} - {table.name}
              </text>
              {isEditing && (
                <text
                  x={(table.x + table.width) * scale - 10}
                  y={table.y * scale + 15}
                  fill="red"
                  fontSize="14"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={(e) => handleDeleteTable(index, e)}
                >
                  ✕
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default TableEditor;
