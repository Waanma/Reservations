import React from 'react';
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
  return (
    <>
      {tables.map((table) => {
        const originalIndex = tables.findIndex((t) => t.id === table.id);
        return (
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
                onMouseDown={(e) => handleTableMouseDown(originalIndex, e)}
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
                onMouseDown={(e) => handleTableMouseDown(originalIndex, e)}
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
              onDoubleClick={(e) => handleEditTable(originalIndex, e)}
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
                onClick={(e) => handleDeleteTable(originalIndex, e)}
              >
                ✕
              </text>
            )}
          </g>
        );
      })}
    </>
  );
};

export default TableRenderer;
