'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Table, MergeRule, FigureEditorProps } from '@/types/types';
import Configuration from '../Configuration';
import { useZoomContext } from '@/contexts/ZoomContext';
import FiguresHeader from './FiguresHeader';
import Grid from '../Grid';
import TableRenderer from './TableRenderer';

function getNewTableId(tables: Table[]): number {
  return tables.length === 0 ? 1 : Math.max(...tables.map((t) => t.id)) + 1;
}

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

const FigureEditor: React.FC<FigureEditorProps> = ({
  tables,
  setTables,
  scale,
  position,
  salonPolygon,
  onSwitchToPerimeter,
  handlePanMouseDown,
  showGrid = true,
}) => {
  // Estados locales para edición y creación
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [addingTable, setAddingTable] = useState<boolean>(false);
  const [selectedShape, setSelectedShape] = useState<'rect' | 'circle'>('rect');
  const { zoom, setZoom } = useZoomContext();
  const [draftTable, setDraftTable] = useState<Table | null>(null);
  const [mergeRules, setMergeRules] = useState<MergeRule[]>([]);
  const drawingStart = useRef<{ x: number; y: number } | null>(null);
  const draftRef = useRef<Table | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  const [activeTab, setActiveTab] = useState<'figure' | 'configuration'>(
    'figure'
  );
  const [currentTime, setCurrentTime] = useState('14:00');

  // Estado local para el tamaño del SVG
  const [localSvgSize, setLocalSvgSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const handleResize = () => {
      setLocalSvgSize({
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.8,
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listener para el evento wheel
  useLayoutEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomFactor = 0.1;
      setZoom((prevZoom) =>
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
      svgEl.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (svgEl) {
        svgEl.removeEventListener('wheel', handleWheel);
      }
    };
  }, [setZoom]);

  // Función para alternar el modo de edición
  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
    setAddingTable(false);
  };

  // Función para iniciar la creación de una figura
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
      const newX = table.x + deltaX / (scale * zoom);
      const newY = table.y + deltaY / (scale * zoom);
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
      const startX = (e.clientX - svgRect.left - position.x) / (scale * zoom);
      const startY = (e.clientY - svgRect.top - position.y) / (scale * zoom);
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
          (moveEvent.clientX - svgRect.left - position.x) / (scale * zoom);
        const y =
          (moveEvent.clientY - svgRect.top - position.y) / (scale * zoom);
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

  // Función para editar la figura (se abre el modal de configuración)
  const handleEditTable = (
    index: number,
    e: React.MouseEvent<SVGTextElement, MouseEvent>
  ) => {
    e.stopPropagation();
    const table = tables[index];
    if (!table) return;
    setTableToEdit({ ...table });
    setActiveTab('figure');
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

  // Lógica de fusión
  const mergedTables = tables.map((table) => {
    for (const rule of mergeRules) {
      if (
        isTimeInRange(currentTime, rule.activeFrom, rule.activeTo) &&
        rule.mergeFrom.includes(table.id)
      ) {
        return {
          ...table,
          mergeId: rule.newId,
          name: rule.newName,
          mergedColor: rule.newColor,
        };
      }
    }
    return table;
  });

  // Panel de creación de figuras
  const CreateFigurePanel = () => (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      <button
        onClick={() => startAddTable('rect')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor:
            addingTable && selectedShape === 'rect' ? 'green' : '#ccc',
          color: addingTable && selectedShape === 'rect' ? 'white' : '#333',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Create Rectangle
      </button>
      <button
        onClick={() => startAddTable('circle')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor:
            addingTable && selectedShape === 'circle' ? 'green' : '#ccc',
          color: addingTable && selectedShape === 'circle' ? 'white' : '#333',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Create Circle
      </button>
    </div>
  );

  const salonXs = salonPolygon ? salonPolygon.map(([x]) => x) : [];
  const salonYs = salonPolygon ? salonPolygon.map(([, y]) => y) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <label className="font-medium">Current Time:</label>
        <input
          type="time"
          value={currentTime}
          onChange={(e) => setCurrentTime(e.target.value)}
          className="p-1 border rounded"
        />
      </div>
      <FiguresHeader
        zoom={zoom}
        setZoom={setZoom}
        toggleEditMode={toggleEditMode}
        onSwitchToPerimeter={onSwitchToPerimeter}
      />
      {isEditing && <CreateFigurePanel />}
      <svg
        ref={svgRef}
        id="svg-canvas"
        width={localSvgSize.width}
        height={localSvgSize.height}
        onMouseDown={handleSVGMouseDown}
        className="border border-gray-300 cursor-crosshair"
      >
        <g transform={`translate(${position.x}, ${position.y}) scale(${zoom})`}>
          {showGrid && (
            <Grid
              scale={scale}
              width={localSvgSize.width}
              height={localSvgSize.height}
              salonXs={salonXs}
              salonYs={salonYs}
            />
          )}
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
              fill={
                draftTable.color ? draftTable.color : 'rgba(0, 0, 255, 0.3)'
              }
              stroke="blue"
              strokeDasharray="4"
              strokeWidth="2"
            />
          ) : draftTable ? (
            <circle
              cx={draftTable.x * scale}
              cy={draftTable.y * scale}
              r={(draftTable.radius || 0) * scale}
              fill={
                draftTable.color ? draftTable.color : 'rgba(0, 0, 255, 0.3)'
              }
              stroke="blue"
              strokeDasharray="4"
              strokeWidth="2"
            />
          ) : null}
          <TableRenderer
            tables={mergedTables}
            scale={scale}
            isEditing={isEditing}
            handleTableMouseDown={handleTableMouseDown}
            handleDeleteTable={handleDeleteTable}
            handleEditTable={handleEditTable}
          />
        </g>
      </svg>
      {tableToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-3/6 relative">
            <button
              onClick={handleModalCancel}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              X
            </button>
            <div className="flex justify-center border-b mb-4">
              <button
                onClick={() => setActiveTab('figure')}
                className={`py-2 px-4 ${
                  activeTab === 'figure'
                    ? 'border-b-2 border-blue-500 font-bold'
                    : ''
                }`}
              >
                Figure
              </button>
              <button
                onClick={() => setActiveTab('configuration')}
                className={`py-2 px-4 ${
                  activeTab === 'configuration'
                    ? 'border-b-2 border-blue-500 font-bold'
                    : ''
                }`}
              >
                Configuration
              </button>
            </div>
            {activeTab === 'figure' ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Edit Figure {tableToEdit.id}
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
                  Price & Merge Configuration
                </h3>
                <Configuration
                  onClose={handleModalCancel}
                  tables={tables.map(({ id, name }) => ({ id, name }))}
                  mergeRules={mergeRules}
                  setMergeRules={setMergeRules}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FigureEditor;
