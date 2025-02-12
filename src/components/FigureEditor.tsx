'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Table } from '@/types/types';
import Configuration from './Configuration';

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
    setIsEditing((prev) => {
      const newState = !prev;
      console.log('isEditing:', newState);
      return newState;
    });
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
    setTables((prevTables) =>
      prevTables.map((tbl) => (tbl.id === tableToEdit.id ? tableToEdit : tbl))
    );
    setTableToEdit(null);
  };

  const handleModalCancel = () => {
    setTableToEdit(null);
  };

  return (
    <div className="space-y-6">
      <Configuration />
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
        id="svg-canvas"
        width={svgSize.width}
        height={svgSize.height}
        onMouseDown={handleSVGMouseDown}
        className="border border-gray-300 cursor-crosshair"
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

      {tableToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3>Edit {tableToEdit.id}</h3>
            <div className="space-y-4 mt-4">
              <label className="block">
                Name:
                <input
                  type="text"
                  value={tableToEdit.name}
                  onChange={(e) => handleModalChange(e, 'name')}
                  className="mt-1 p-2 border rounded w-full"
                />
              </label>
              {tableToEdit.shape === 'rect' && (
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
              )}
              {tableToEdit.shape === 'circle' && (
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
        </div>
      )}
    </div>
  );
};

export default FigureEditor;
