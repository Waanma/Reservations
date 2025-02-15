'use client';

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Table } from '@/types/types';

interface TableRendererProps {
  tables: Table[];
  scale: number;
  isEditing: boolean;
  handleTableMouseDown: (
    index: number,
    e: React.MouseEvent<SVGElement, MouseEvent>
  ) => void;
  handleDeleteTable: (index: number, e: React.MouseEvent) => void;
  handleEditTable: (
    index: number,
    e: React.MouseEvent<SVGTextElement, MouseEvent>
  ) => void;
}

const TableRenderer: React.FC<TableRendererProps> = ({
  tables,
  scale,
  isEditing,
  handleTableMouseDown,
  handleDeleteTable,
  handleEditTable,
}) => {
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (table: Table, e: React.MouseEvent<SVGElement>) => {
    setHoveredTable(table);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredTable(null);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      {tables.map((table, idx) => {
        const key = table.id + '-' + idx;
        const fillColor = table.mergedColor
          ? table.mergedColor
          : 'rgba(0, 0, 255, 0.3)';

        const displayId = table.mergeId ?? table.id;

        return (
          <g
            key={key}
            onMouseEnter={(e) => handleMouseEnter(table, e)}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
          >
            {table.shape === 'rect' ? (
              <rect
                x={table.x * scale}
                y={table.y * scale}
                width={(table.width || 0) * scale}
                height={(table.height || 0) * scale}
                fill={fillColor}
                stroke="blue"
                strokeWidth="2"
                cursor={isEditing ? 'move' : 'default'}
                onMouseDown={(e) => handleTableMouseDown(idx, e)}
              />
            ) : (
              <circle
                cx={table.x * scale}
                cy={table.y * scale}
                r={(table.radius || 0) * scale}
                fill={fillColor}
                stroke="blue"
                strokeWidth="2"
                cursor={isEditing ? 'move' : 'default'}
                onMouseDown={(e) => handleTableMouseDown(idx, e)}
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
              onDoubleClick={(e) => handleEditTable(idx, e)}
              className="select-none"
            >
              {displayId} - {table.name}
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
                onClick={(e) => handleDeleteTable(idx, e)}
              >
                ✕
              </text>
            )}
          </g>
        );
      })}

      {/* Render del tooltip flotante usando un portal */}
      {hoveredTable &&
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
            <div>ID: {hoveredTable.id}</div>
            <div>Name: {hoveredTable.name}</div>
            {hoveredTable.mergeId && (
              <div>Merge id: {hoveredTable.mergeId}</div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};

export default TableRenderer;
