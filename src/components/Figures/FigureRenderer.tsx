'use client';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Figure } from '@/types/types';
import { LuTrash2 } from 'react-icons/lu';

interface FigureRendererProps {
  figures: Figure[];
  scale: number;
  zoom: number;
  isEditing: boolean;
  handleFigureMouseDown: (
    index: number,
    e: React.MouseEvent<SVGElement, MouseEvent>
  ) => void;
  handleDeleteFigure: (index: number, e: React.MouseEvent) => void;
  handleEditFigure: (
    index: number,
    e: React.MouseEvent<SVGTextElement, MouseEvent>
  ) => void;
  onFigureSelect?: (figure: Figure) => void;
}

const FigureRenderer: React.FC<FigureRendererProps> = ({
  figures,
  scale,
  isEditing,
  handleFigureMouseDown,
  handleDeleteFigure,
  handleEditFigure,
  onFigureSelect,
}) => {
  const [hoveredFigure, setHoveredFigure] = useState<Figure | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (
    figure: Figure,
    e: React.MouseEvent<SVGElement>
  ) => {
    setHoveredFigure(figure);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredFigure(null);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (hoveredFigure && !figures.some((t) => t.id === hoveredFigure.id)) {
      setHoveredFigure(null);
    }
  }, [figures, hoveredFigure]);

  return (
    <>
      {figures.map((figure, idx) => {
        const key = figure.id + '-' + idx;
        const fillColor = figure.mergedColor
          ? figure.mergedColor
          : 'rgba(0, 0, 255, 0.3)';
        const displayId = figure.mergeId ?? figure.id;

        return (
          <g
            key={key}
            onMouseEnter={(e) => handleMouseEnter(figure, e)}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            onClick={(e) => {
              e.stopPropagation();
              if (onFigureSelect) {
                onFigureSelect(figure);
              }
            }}
          >
            {figure.shape === 'rect' ? (
              <rect
                x={figure.x * scale}
                y={figure.y * scale}
                width={(figure.width || 0) * scale}
                height={(figure.height || 0) * scale}
                fill={fillColor}
                stroke="black"
                strokeWidth="2"
                cursor={isEditing ? 'move' : 'default'}
                onMouseDown={(e) => handleFigureMouseDown(idx, e)}
              />
            ) : (
              <circle
                cx={figure.x * scale}
                cy={figure.y * scale}
                r={(figure.radius || 0) * scale}
                fill={fillColor}
                stroke="black"
                strokeWidth="2"
                cursor={isEditing ? 'move' : 'default'}
                onMouseDown={(e) => handleFigureMouseDown(idx, e)}
              />
            )}

            <text
              x={
                figure.shape === 'rect'
                  ? (figure.x + (figure.width || 0) / 2) * scale
                  : figure.x * scale
              }
              y={
                figure.shape === 'rect'
                  ? (figure.y + (figure.height || 0) / 2) * scale
                  : figure.y * scale
              }
              fill="black"
              fontSize={12}
              textAnchor="middle"
              onDoubleClick={(e) => handleEditFigure(idx, e)}
              className="select-none"
            >
              {displayId} - {figure.name}
            </text>

            {isEditing && (
              <g
                onClick={(e) => handleDeleteFigure(idx, e)}
                className="cursor-pointer"
              >
                <foreignObject
                  x={
                    figure.shape === 'rect'
                      ? (figure.x + (figure.width || 0)) * scale - 10
                      : figure.x * scale + (figure.radius || 0) * scale - 10
                  }
                  y={
                    figure.shape === 'rect'
                      ? figure.y * scale - 10
                      : figure.y * scale - 10
                  }
                  width={20}
                  height={20}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      borderRadius: '50%',
                      border: '1px solid red',
                      cursor: 'pointer',
                    }}
                  >
                    <LuTrash2 size={14} color="red" />
                  </div>
                </foreignObject>
              </g>
            )}
          </g>
        );
      })}

      {hoveredFigure &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              left: mousePos.x + 10,
              top: mousePos.y + 10,
              backgroundColor: 'white',
              border: '1px solid gray',
              borderRadius: '4px',
              padding: '6px 8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            <div>ID: {hoveredFigure.id}</div>
            <div>Name: {hoveredFigure.name}</div>
            {hoveredFigure.mergeId && (
              <div>Merge id: {hoveredFigure.mergeId}</div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};

export default FigureRenderer;
