'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Table } from '@/types/types';
import { activeButtonStyle, inactiveButtonStyle } from '@/styles/buttonStyles';

function getNewTableId(tables: Table[]): number {
  if (tables.length === 0) return 1;
  return Math.max(...tables.map((t) => t.id)) + 1;
}

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
  showGrid?: boolean;
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
  showGrid = true,
}) => {
  // Estados y refs
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [addingTable, setAddingTable] = useState<boolean>(false);
  const [selectedShape, setSelectedShape] = useState<'rect' | 'circle'>('rect');
  const [draftTable, setDraftTable] = useState<Table | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const drawingStart = useRef<{ x: number; y: number } | null>(null);
  const draftRef = useRef<Table | null>(null); // Para mantener el draft actualizado

  // Nuevo estado para mostrar el modal de edición
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);

  useEffect(() => {
    console.log('--- Render TableEditor ---');
    console.log(
      'isEditing:',
      isEditing,
      'addingTable:',
      addingTable,
      'draftTable:',
      draftTable
    );
    console.log('tables:', tables);
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

  // Permite arrastrar una mesa únicamente en modo edición.
  const handleTableMouseDown = (
    index: number,
    e: React.MouseEvent<SVGElement, MouseEvent>
  ) => {
    if (!isEditing) return; // Solo se permite arrastrar en modo edición
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
              name: `Mesa ${newId}`,
              shape: 'rect',
              x: startX,
              y: startY,
              width: 0,
              height: 0,
            }
          : {
              id: newId,
              name: `Mesa ${newId}`,
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
          const updated = { ...prev } as Table;
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
        const currentDraft = draftRef.current!;
        if (!currentDraft || !drawingStart.current) {
          setAddingTable(false);
          return;
        }
        let finalized = { ...currentDraft } as Table;
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
          finalized = { ...finalized, x, y, width, height } as Table;
        } else if (finalized.shape === 'circle') {
          if ((finalized.radius || 0) === 0) finalized.radius = 1;
        }

        setTables((prevTables) => [...prevTables, finalized]);
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

  // Al hacer doble clic se abre el modal de edición en lugar de usar prompts.
  const handleEditTable = (
    index: number,
    e: React.MouseEvent<SVGTextElement, MouseEvent>
  ) => {
    e.stopPropagation();
    const table = tables[index];
    if (!table || !isEditing) return;
    setTableToEdit({ ...table });
  };

  const handleDeleteTable = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTables((prev) => prev.filter((_, i) => i !== index));
  };

  // Actualiza el valor en el modal cuando el usuario cambia un campo.
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

  // Guarda los cambios realizados en el modal.
  const handleModalSave = () => {
    if (!tableToEdit) return;
    setTables((prevTables) =>
      prevTables.map((tbl) => (tbl.id === tableToEdit.id ? tableToEdit : tbl))
    );
    setTableToEdit(null);
  };

  // Cancela la edición y cierra el modal.
  const handleModalCancel = () => {
    setTableToEdit(null);
  };

  return (
    <div>
      <div style={{ margin: '0.5rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={toggleEditMode}>
          {isEditing ? 'Salir de Modo Edición' : 'Editar'}
        </button>
        <button onClick={onSwitchToSalon} disabled={isEditing}>
          Editar Salón
        </button>
        {isEditing && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => startAddTable('rect')}
              style={
                addingTable && selectedShape === 'rect'
                  ? activeButtonStyle
                  : inactiveButtonStyle
              }
            >
              Crear Mesa Rectangular
            </button>
            <button
              onClick={() => startAddTable('circle')}
              style={
                addingTable && selectedShape === 'circle'
                  ? activeButtonStyle
                  : inactiveButtonStyle
              }
            >
              Crear Mesa Redonda
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
        style={{ margin: '0.5rem' }}
      />
      <svg
        id="svg-canvas"
        width={svgSize.width}
        height={svgSize.height}
        onMouseDown={handleSVGMouseDown}
        style={{
          border: '1px solid #ddd',
          cursor: addingTable ? 'crosshair' : 'default',
        }}
      >
        <g
          transform={`translate(${position.x}, ${position.y}) scale(${currentZoom})`}
        >
          {showGrid && <g>{/* Líneas de la cuadrícula */}</g>}
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
          {tables.map((table, index) => (
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
                style={{ userSelect: 'none', pointerEvents: 'all' }}
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

      {/* Modal para editar la mesa */}
      {tableToEdit && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '5px',
              minWidth: '300px',
            }}
          >
            <h3>Editar Mesa {tableToEdit.id}</h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <label>
                Nombre:
                <input
                  type="text"
                  value={tableToEdit.name}
                  onChange={(e) => handleModalChange(e, 'name')}
                />
              </label>
              {tableToEdit.shape === 'rect' && (
                <>
                  <label>
                    Ancho (m):
                    <input
                      type="number"
                      value={tableToEdit.width || 0}
                      onChange={(e) => handleModalChange(e, 'width')}
                    />
                  </label>
                  <label>
                    Alto (m):
                    <input
                      type="number"
                      value={tableToEdit.height || 0}
                      onChange={(e) => handleModalChange(e, 'height')}
                    />
                  </label>
                </>
              )}
              {tableToEdit.shape === 'circle' && (
                <label>
                  Radio (m):
                  <input
                    type="number"
                    value={tableToEdit.radius || 0}
                    onChange={(e) => handleModalChange(e, 'radius')}
                  />
                </label>
              )}
            </div>
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
              }}
            >
              <button onClick={handleModalCancel}>Cancelar</button>
              <button onClick={handleModalSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableEditor;
