'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Figure, MergeRule, FigureEditorProps } from '@/types/types';
import Configuration from '../Configuration';
import { useZoomContext } from '@/contexts/ZoomContext';
import FiguresHeader from './FiguresHeader';
import Grid from '../Grid';
import FigureRenderer from './FigureRenderer';

function getNewFigureId(figures: Figure[]): number {
  return figures.length === 0 ? 1 : Math.max(...figures.map((t) => t.id)) + 1;
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

interface ExtendedFigureEditorProps extends FigureEditorProps {
  editable?: boolean;
}

const FigureEditor: React.FC<ExtendedFigureEditorProps> = ({
  figures,
  setFigures,
  scale,
  position,
  salonPolygon,
  onSwitchToPerimeter,
  handlePanMouseDown,
  showGrid = true,
  onFigureSelect,
  editable = false,
}) => {
  // Estados para edición y creación (solo se usan en modo edición)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [addingFigure, setAddingFigure] = useState<boolean>(false);
  const [selectedShape, setSelectedShape] = useState<'rect' | 'circle'>('rect');
  const { zoom, setZoom } = useZoomContext();
  const [draftFigure, setDraftFigure] = useState<Figure | null>(null);
  const [mergeRules, setMergeRules] = useState<MergeRule[]>([]);
  const drawingStart = useRef<{ x: number; y: number } | null>(null);
  const draftRef = useRef<Figure | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [figureToEdit, setFigureToEdit] = useState<Figure | null>(null);
  const [activeTab, setActiveTab] = useState<'figure' | 'configuration'>(
    'figure'
  );
  const [currentTime, setCurrentTime] = useState('14:00');

  // Tamaño local del SVG según viewport
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

  // Zoom mediante la rueda del mouse
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

  const toggleEditMode = () => {
    if (!editable) return;
    setIsEditing((prev) => !prev);
    setAddingFigure(false);
  };

  const startAddFigure = (shape: 'rect' | 'circle') => {
    if (!editable) return;
    setSelectedShape(shape);
    setAddingFigure(true);
    setDraftFigure(null);
    drawingStart.current = null;
  };

  // Permite arrastrar las figuras en ambos modos
  const handleFigureMouseDown = (
    index: number,
    e: React.MouseEvent<SVGElement, MouseEvent>
  ) => {
    if (!editable) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const figure = figures[index];
    if (!figure) return;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newX = figure.x + deltaX / (scale * zoom);
      const newY = figure.y + deltaY / (scale * zoom);
      setFigures((prev) => {
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
    if (addingFigure && editable) {
      if (draftFigure) return;
      const svgRect = e.currentTarget.getBoundingClientRect();
      const startX = (e.clientX - svgRect.left - position.x) / (scale * zoom);
      const startY = (e.clientY - svgRect.top - position.y) / (scale * zoom);
      drawingStart.current = { x: startX, y: startY };
      const newId = getNewFigureId(figures);
      const newDraft: Figure =
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
      setDraftFigure(newDraft);
      draftRef.current = newDraft;
      const handleGlobalMouseMove = (moveEvent: MouseEvent) => {
        const x =
          (moveEvent.clientX - svgRect.left - position.x) / (scale * zoom);
        const y =
          (moveEvent.clientY - svgRect.top - position.y) / (scale * zoom);
        setDraftFigure((prev) => {
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
          setAddingFigure(false);
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
        setFigures((prev) => [...prev, finalized]);
        setDraftFigure(null);
        draftRef.current = null;
        setAddingFigure(false);
        drawingStart.current = null;
        window.removeEventListener('mousemove', handleGlobalMouseMove);
      };
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp, { once: true });
    } else {
      handlePanMouseDown(e);
    }
  };

  // Función para editar la figura (abre modal de configuración) solo en modo edición
  const handleEditFigure = (
    index: number,
    e: React.MouseEvent<SVGTextElement, MouseEvent>
  ) => {
    e.stopPropagation();
    const figure = figures[index];
    if (!figure) return;
    if (editable) {
      setFigureToEdit({ ...figure });
      setActiveTab('figure');
    } else {
      if (onFigureSelect) {
        onFigureSelect(figure);
      }
    }
  };

  const handleDeleteFigure = (index: number, e: React.MouseEvent) => {
    if (!editable) return;
    e.stopPropagation();
    const figureToDelete = figures[index];
    const isMerged = mergeRules.some((rule) =>
      rule.mergeFrom.includes(figureToDelete.id)
    );
    const confirmMsg = isMerged
      ? 'This figure is merged in one or more merge rules. Do you really want to delete it?'
      : 'Are you sure you want to delete this figure?';
    if (!window.confirm(confirmMsg)) {
      return;
    }
    setFigures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModalChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Figure
  ) => {
    if (!figureToEdit) return;
    const value = e.target.value;
    setFigureToEdit({
      ...figureToEdit,
      [field]: field === 'name' ? value : parseFloat(value) || 0,
    });
  };

  const handleModalSave = () => {
    if (!figureToEdit) return;
    setFigures((prev) =>
      prev.map((tbl) => (tbl.id === figureToEdit.id ? figureToEdit : tbl))
    );
    setFigureToEdit(null);
  };

  const handleModalCancel = () => {
    setFigureToEdit(null);
  };

  const mergedFigures = figures.map((figure) => {
    for (const rule of mergeRules) {
      if (
        isTimeInRange(currentTime, rule.activeFrom, rule.activeTo) &&
        rule.mergeFrom.includes(figure.id)
      ) {
        return {
          ...figure,
          mergeId: rule.newId,
          name: rule.newName,
          mergedColor: rule.newColor,
        };
      }
    }
    return figure;
  });

  const CreateFigurePanel = () => (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      <button
        onClick={() => startAddFigure('rect')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor:
            addingFigure && selectedShape === 'rect' ? 'green' : '#ccc',
          color: addingFigure && selectedShape === 'rect' ? 'white' : '#333',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Create Rectangle
      </button>
      <button
        onClick={() => startAddFigure('circle')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor:
            addingFigure && selectedShape === 'circle' ? 'green' : '#ccc',
          color: addingFigure && selectedShape === 'circle' ? 'white' : '#333',
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
        hideEditingControls={!editable}
      />
      {editable && isEditing && <CreateFigurePanel />}
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
          {draftFigure && draftFigure.shape === 'rect' ? (
            <rect
              x={draftFigure.x * scale}
              y={draftFigure.y * scale}
              width={(draftFigure.width || 0) * scale}
              height={(draftFigure.height || 0) * scale}
              fill={
                draftFigure.color ? draftFigure.color : 'rgba(0, 0, 255, 0.3)'
              }
              stroke="black"
              strokeDasharray="4"
              strokeWidth="2"
            />
          ) : draftFigure ? (
            <circle
              cx={draftFigure.x * scale}
              cy={draftFigure.y * scale}
              r={(draftFigure.radius || 0) * scale}
              fill={
                draftFigure.color ? draftFigure.color : 'rgba(0, 0, 255, 0.3)'
              }
              stroke="black"
              strokeDasharray="4"
              strokeWidth="2"
            />
          ) : null}
          <FigureRenderer
            figures={mergedFigures}
            scale={scale}
            zoom={zoom}
            isEditing={editable ? isEditing : false}
            handleFigureMouseDown={handleFigureMouseDown}
            handleDeleteFigure={
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              editable ? handleDeleteFigure : (_index, _e) => {}
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            handleEditFigure={editable ? handleEditFigure : (_index, _e) => {}}
            onFigureSelect={onFigureSelect}
          />
        </g>
      </svg>
      {editable && figureToEdit && (
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
                    ? 'border-b-2 border-black font-bold'
                    : ''
                }`}
              >
                Figure
              </button>
              <button
                onClick={() => setActiveTab('configuration')}
                className={`py-2 px-4 ${
                  activeTab === 'configuration'
                    ? 'border-b-2 border-black font-bold'
                    : ''
                }`}
              >
                Configuration
              </button>
            </div>
            {activeTab === 'figure' ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Edit Figure {figureToEdit.id}
                </h3>
                <div className="space-y-4">
                  <label className="block">
                    Name:
                    <input
                      type="text"
                      value={figureToEdit.name}
                      onChange={(e) => handleModalChange(e, 'name')}
                      className="mt-1 p-2 border rounded w-full"
                    />
                  </label>
                  {figureToEdit.shape === 'rect' ? (
                    <>
                      <label className="block">
                        Width (m):
                        <input
                          type="number"
                          value={figureToEdit.width || 0}
                          onChange={(e) => handleModalChange(e, 'width')}
                          className="mt-1 p-2 border rounded w-full"
                        />
                      </label>
                      <label className="block">
                        Height (m):
                        <input
                          type="number"
                          value={figureToEdit.height || 0}
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
                        value={figureToEdit.radius || 0}
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
                  figures={figures.map(({ id, name }) => ({ id, name }))}
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
