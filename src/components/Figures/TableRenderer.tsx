'use client';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Table } from '@/types/types';
import { LuTrash2 } from 'react-icons/lu';

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

  useEffect(() => {
    if (hoveredTable && !tables.some((t) => t.id === hoveredTable.id)) {
      setHoveredTable(null);
    }
  }, [tables, hoveredTable]);

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
                stroke="black"
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
                stroke="black"
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
              <g
                onClick={(e) => handleDeleteTable(idx, e)}
                className="cursor-pointer"
              >
                <foreignObject
                  x={
                    table.shape === 'rect'
                      ? (table.x + (table.width || 0)) * scale - 10 // Centrado a la mitad del contenedor (20/2)
                      : table.x * scale + (table.radius || 0) * scale - 10
                  }
                  y={
                    table.shape === 'rect'
                      ? table.y * scale - 10
                      : table.y * scale - 10
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
