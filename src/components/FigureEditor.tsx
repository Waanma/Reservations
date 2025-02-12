'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Table } from '@/types/types';
import Configuration from './Configuration';

function getNewTableId(tables: Table[]): number {
  return tables.length === 0 ? 1 : Math.max(...tables.map((t) => t.id)) + 1;
}

// Regla de fusión: define qué figuras se unen para que se muestre otra
interface MergeRule {
  mergeFrom: number[]; // IDs de las figuras base
  mergeInto: number; // ID de la figura fusionada (ya creada)
  activeFrom: string; // hora de inicio (formato "HH:MM")
  activeTo: string; // hora de fin (formato "HH:MM")
}

// Ejemplo de regla: las figuras 1 y 2 se fusionan en la figura 3 de 15:00 a 18:00
const mergeRules: MergeRule[] = [
  {
    mergeFrom: [1, 2],
    mergeInto: 3,
    activeFrom: '15:00',
    activeTo: '18:00',
  },
];

// Función que comprueba si una hora (en "HH:MM") se encuentra dentro de un rango
const isTimeInRange = (
  current: string,
  start: string,
  end: string
): boolean => {
  const [currentH, currentM] = current.split(':').map(Number);
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const currentTotal = currentH * 60 + currentM;
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  return currentTotal >= startTotal && currentTotal <= endTotal;
};

interface TableEditorProps {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  scale: number;
  zoom: number;
  position: { x: number; y: number };
  svgSize: { width: number; height: number };
  salonPolygon: number[][] | null;
  onSwitchToPerimeter: () => void;
  handlePanMouseDown: (e: React.MouseEvent<Element, MouseEvent>) => void;
  showGrid?: boolean;
}

const FigureEditor: React.FC<TableEditorProps> = ({
  tables,
  setTables,
  scale,
  zoom,
  position,
  svgSize,
  salonPolygon,
  onSwitchToPerimeter,
  handlePanMouseDown,
  showGrid = true,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [addingTable, setAddingTable] = useState<boolean>(false);
  const [selectedShape, setSelectedShape] = useState<'rect' | 'circle'>('rect');
  const [draftTable, setDraftTable] = useState<Table | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const drawingStart = useRef<{ x: number; y: number } | null>(null);
  const draftRef = useRef<Table | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  // Estado para las pestañas del modal: 'figura' o 'configuracion'
  const [activeTab, setActiveTab] = useState<'figura' | 'configuracion'>(
    'figura'
  );

  // Estado para simular la hora actual (en "HH:MM")
  const [currentTime, setCurrentTime] = useState('14:00');

  useEffect(() => {
    console.log('--- Render TableEditor ---');
  }, [isEditing, addingTable, draftTable, tables]);

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
    setAddingTable(false);
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentZoom(parseFloat(e.target.value));
  };

  const startAddTable = (shape: 'rect' | 'circle') => {
    if (!isEditing) return;
    setSelectedShape(shape);
    setAddingTable(true);
    setDraftTable(null);
    drawingStart.current = null;
  };

  const handleTableMouseDown = (
    index: number,
    e: React.MouseEvent<SVGElement, MouseEvent>
  ) => {
    if (!isEditing) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const table = tables[index];
    if (!table) return;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newX = table.x + deltaX / (scale * currentZoom);
      const newY = table.y + deltaY / (scale * currentZoom);
      setTables((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], x: newX, y: newY };
        return updated;
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleSVGMouseDown = (
    e: React.MouseEvent<SVGSVGElement, MouseEvent>
  ) => {
    if (addingTable) {
      if (draftTable) return;
      const svgRect = e.currentTarget.getBoundingClientRect();
      const startX =
        (e.clientX - svgRect.left - position.x) / (scale * currentZoom);
      const startY =
        (e.clientY - svgRect.top - position.y) / (scale * currentZoom);
      drawingStart.current = { x: startX, y: startY };

      const newId = getNewTableId(tables);
      const newDraft: Table =
        selectedShape === 'rect'
          ? {
              id: newId,
              name: `Square ${newId}`,
              shape: 'rect',
              x: startX,
              y: startY,
              width: 0,
              height: 0,
            }
          : {
              id: newId,
              name: `Circle ${newId}`,
              shape: 'circle',
              x: startX,
              y: startY,
              radius: 0,
            };
      setDraftTable(newDraft);
      draftRef.current = newDraft;

      const handleGlobalMouseMove = (moveEvent: MouseEvent) => {
        const x =
          (moveEvent.clientX - svgRect.left - position.x) /
          (scale * currentZoom);
        const y =
          (moveEvent.clientY - svgRect.top - position.y) /
          (scale * currentZoom);
        setDraftTable((prev) => {
          if (!prev || !drawingStart.current) return prev;
          const updated = { ...prev };
          if (updated.shape === 'rect') {
            updated.width = x - drawingStart.current.x;
            updated.height = y - drawingStart.current.y;
          } else {
            updated.radius = Math.hypot(
              x - drawingStart.current.x,
              y - drawingStart.current.y
            );
          }
          draftRef.current = updated;
          return updated;
        });
      };

      const handleGlobalMouseUp = () => {
        const currentDraft = draftRef.current;
        if (!currentDraft || !drawingStart.current) {
          setAddingTable(false);
          return;
        }
        let finalized = { ...currentDraft };
        if (finalized.shape === 'rect') {
          let { x, y, width = 0, height = 0 } = finalized;
          if (width < 0) {
            x += width;
            width = Math.abs(width);
          }
          if (height < 0) {
            y += height;
            height = Math.abs(height);
          }
          if (width === 0 && height === 0) {
            width = 2;
            height = 1;
          }
          finalized = { ...finalized, x, y, width, height };
        } else if (finalized.shape === 'circle') {
          if ((finalized.radius || 0) === 0) finalized.radius = 1;
        }
        setTables((prev) => [...prev, finalized]);
        setDraftTable(null);
        draftRef.current = null;
        setAddingTable(false);
        drawingStart.current = null;
        window.removeEventListener('mousemove', handleGlobalMouseMove);
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp, { once: true });
    } else {
      handlePanMouseDown(e);
    }
  };

  const handleEditTable = (
    index: number,
    e: React.MouseEvent<SVGTextElement, MouseEvent>
  ) => {
    e.stopPropagation();
    const table = tables[index];
    if (!table || !isEditing) return;
    setTableToEdit({ ...table });
    setActiveTab('figura');
  };

  const handleDeleteTable = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTables((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModalChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Table
  ) => {
    if (!tableToEdit) return;
    const value = e.target.value;
    setTableToEdit({
      ...tableToEdit,
      [field]: field === 'name' ? value : parseFloat(value) || 0,
    });
  };

  const handleModalSave = () => {
    if (!tableToEdit) return;
    setTables((prev) =>
      prev.map((tbl) => (tbl.id === tableToEdit.id ? tableToEdit : tbl))
    );
    setTableToEdit(null);
  };

  const handleModalCancel = () => {
    setTableToEdit(null);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    // Si deltaY es negativo, se hace zoom in; si es positivo, zoom out.
    const newZoom =
      e.deltaY < 0 ? currentZoom + zoomFactor : currentZoom - zoomFactor;
    // Aseguramos que el zoom se mantenga entre 0.1 y 3
    setCurrentZoom(Math.max(0.1, Math.min(newZoom, 3)));
  };

  // --- Lógica de fusión de figuras --- //

  // Determinar qué reglas están activas según la hora actual simulada
  const activeMergeRules = mergeRules.filter((rule) =>
    isTimeInRange(currentTime, rule.activeFrom, rule.activeTo)
  );

  // A partir de las reglas activas se filtran las figuras a mostrar
  let visibleTables = tables;
  activeMergeRules.forEach((rule) => {
    visibleTables = visibleTables.filter(
      (table) => !rule.mergeFrom.includes(table.id)
    );
  });

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomFactor = 0.1;
      setCurrentZoom((prevZoom) =>
        Math.max(
          0.1,
          Math.min(
            e.deltaY < 0 ? prevZoom + zoomFactor : prevZoom - zoomFactor,
            3
          )
        )
      );
    };

    const svgEl = svgRef.current;
    if (svgEl) {
      // Registramos el listener como no pasivo
      svgEl.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (svgEl) {
        svgEl.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Simulador de hora actual */}
      <div className="flex items-center gap-2">
        <label className="font-medium">Current Time:</label>
        <input
          type="time"
          value={currentTime}
          onChange={(e) => setCurrentTime(e.target.value)}
          className="p-1 border rounded"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={toggleEditMode}
          className="py-2 px-4 rounded bg-blue-500 text-white hover:bg-blue-600"
        >
          {isEditing ? 'Exit editing mode' : 'Edit Figures'}
        </button>
        <button
          onClick={onSwitchToPerimeter}
          disabled={isEditing}
          className={`py-2 px-4 rounded ${
            isEditing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
              : 'bg-blue-500 text-white cursor-pointer'
          }`}
        >
          Edit Perimeter
        </button>
        {isEditing && (
          <div className="flex gap-4 items-center">
            <button
              onClick={() => startAddTable('rect')}
              className={`py-2 px-4 rounded ${
                addingTable && selectedShape === 'rect'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              Create Rectangle
            </button>
            <button
              onClick={() => startAddTable('circle')}
              className={`py-2 px-4 rounded ${
                addingTable && selectedShape === 'circle'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              Create Circle
            </button>
          </div>
        )}
      </div>
      <input
        type="range"
        min="0.1"
        max="3"
        step="0.1"
        value={currentZoom}
        onChange={handleZoomChange}
        className="mt-4"
      />
      <svg
        ref={svgRef}
        id="svg-canvas"
        width={svgSize.width}
        height={svgSize.height}
        onMouseDown={handleSVGMouseDown}
        onWheel={handleWheel}
        className="border border-gray-300 cursor-crosshair"
      >
        <g
          transform={`translate(${position.x}, ${position.y}) scale(${currentZoom})`}
        >
          {showGrid && <g>{/* Grid lines here */}</g>}
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
          {draftTable && draftTable.shape === 'rect' ? (
            <rect
              x={draftTable.x * scale}
              y={draftTable.y * scale}
              width={(draftTable.width || 0) * scale}
              height={(draftTable.height || 0) * scale}
              fill="rgba(0, 0, 255, 0.3)"
              stroke="blue"
              strokeDasharray="4"
              strokeWidth="2"
            />
          ) : draftTable ? (
            <circle
              cx={draftTable.x * scale}
              cy={draftTable.y * scale}
              r={(draftTable.radius || 0) * scale}
              fill="rgba(0, 0, 255, 0.3)"
              stroke="blue"
              strokeDasharray="4"
              strokeWidth="2"
            />
          ) : null}
          {visibleTables.map((table, index) => (
            <g key={table.id}>
              {table.shape === 'rect' ? (
                <rect
                  x={table.x * scale}
                  y={table.y * scale}
                  width={(table.width || 0) * scale}
                  height={(table.height || 0) * scale}
                  fill="rgba(0, 0, 255, 0.3)"
                  stroke="blue"
                  strokeWidth="2"
                  cursor={isEditing ? 'move' : 'default'}
                  onMouseDown={(e) => handleTableMouseDown(index, e)}
                />
              ) : (
                <circle
                  cx={table.x * scale}
                  cy={table.y * scale}
                  r={(table.radius || 0) * scale}
                  fill="rgba(0, 0, 255, 0.3)"
                  stroke="blue"
                  strokeWidth="2"
                  cursor={isEditing ? 'move' : 'default'}
                  onMouseDown={(e) => handleTableMouseDown(index, e)}
                />
              )}
              <text
                x={
                  table.shape === 'rect'
                    ? (table.x + (table.width || 0) / 2) * scale
                    : table.x * scale
                }
                y={
                  table.shape === 'rect'
                    ? (table.y + (table.height || 0) / 2) * scale
                    : table.y * scale
                }
                fill="black"
                fontSize={12}
                textAnchor="middle"
                onDoubleClick={(e) => handleEditTable(index, e)}
                className="select-none"
              >
                {table.id} - {table.name}
              </text>
              {isEditing && (
                <text
                  x={
                    table.shape === 'rect'
                      ? (table.x + (table.width || 0)) * scale - 10
                      : table.x * scale + (table.radius || 0) * scale - 10
                  }
                  y={
                    table.shape === 'rect'
                      ? table.y * scale + 15
                      : table.y * scale + (table.radius || 0) * scale + 5
                  }
                  fill="red"
                  fontSize={14}
                  className="cursor-pointer select-none"
                  onClick={(e) => handleDeleteTable(index, e)}
                >
                  ✕
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>

      {/* Modal para editar figura y configuración */}
      {tableToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 relative">
            {/* Botón de cierre global del modal */}
            <button
              onClick={handleModalCancel}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              X
            </button>
            {/* Encabezado con pestañas */}
            <div className="flex justify-center border-b mb-4">
              <button
                onClick={() => setActiveTab('figura')}
                className={`py-2 px-4 ${
                  activeTab === 'figura'
                    ? 'border-b-2 border-blue-500 font-bold'
                    : ''
                }`}
              >
                Figura
              </button>
              <button
                onClick={() => setActiveTab('configuracion')}
                className={`py-2 px-4 ${
                  activeTab === 'configuracion'
                    ? 'border-b-2 border-blue-500 font-bold'
                    : ''
                }`}
              >
                Configuración
              </button>
            </div>
            {activeTab === 'figura' ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Editar Figura {tableToEdit.id}
                </h3>
                <div className="space-y-4">
                  <label className="block">
                    Name:
                    <input
                      type="text"
                      value={tableToEdit.name}
                      onChange={(e) => handleModalChange(e, 'name')}
                      className="mt-1 p-2 border rounded w-full"
                    />
                  </label>
                  {tableToEdit.shape === 'rect' ? (
                    <>
                      <label className="block">
                        Width (m):
                        <input
                          type="number"
                          value={tableToEdit.width || 0}
                          onChange={(e) => handleModalChange(e, 'width')}
                          className="mt-1 p-2 border rounded w-full"
                        />
                      </label>
                      <label className="block">
                        Height (m):
                        <input
                          type="number"
                          value={tableToEdit.height || 0}
                          onChange={(e) => handleModalChange(e, 'height')}
                          className="mt-1 p-2 border rounded w-full"
                        />
                      </label>
                    </>
                  ) : (
                    <label className="block">
                      Radius (m):
                      <input
                        type="number"
                        value={tableToEdit.radius || 0}
                        onChange={(e) => handleModalChange(e, 'radius')}
                        className="mt-1 p-2 border rounded w-full"
                      />
                    </label>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={handleModalCancel}
                    className="py-2 px-4 bg-gray-400 text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleModalSave}
                    className="py-2 px-4 bg-blue-500 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Configuración de Precios
                </h3>
                <Configuration onClose={handleModalCancel} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FigureEditor;
