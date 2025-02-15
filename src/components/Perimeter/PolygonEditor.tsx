import React from 'react';

interface PolygonEditorProps {
  salonCoordinates: number[][];
  scale: number;
  distances: { [key: string]: number };
  onVertexMouseDown: (
    index: number,
    e: React.MouseEvent<SVGCircleElement, MouseEvent>
  ) => void;
  onVertexDelete: (
    index: number,
    e: React.MouseEvent<SVGCircleElement, MouseEvent>
  ) => void;
  onEditDistance: (
    index1: number,
    index2: number,
    e: React.MouseEvent<SVGTextElement, MouseEvent>
  ) => void;
}

const PolygonEditor: React.FC<PolygonEditorProps> = ({
  salonCoordinates,
  scale,
  distances,
  onVertexMouseDown,
  onVertexDelete,
  onEditDistance,
}) => {
  return (
    <>
      <polygon
        points={salonCoordinates
          .map(([x, y]) => `${x * scale},${y * scale}`)
          .join(' ')}
        fill="lightgray"
        stroke="black"
        strokeWidth="2"
      />
      {salonCoordinates.map(([x, y], index) => (
        <g key={index}>
          <circle
            cx={x * scale}
            cy={y * scale}
            r="8"
            fill="red"
            stroke="black"
            strokeWidth="2"
            cursor="pointer"
            onMouseDown={(e) => onVertexMouseDown(index, e)}
            onContextMenu={(e) => onVertexDelete(index, e)}
            onClick={(e) => e.stopPropagation()}
          />
          <text x={x * scale + 10} y={y * scale + 10} fill="black">
            {index + 1}
          </text>
        </g>
      ))}
      {Object.keys(distances).map((key) => {
        const [index1, index2] = key.split('-').map(Number);
        if (
          index1 >= salonCoordinates.length ||
          index2 >= salonCoordinates.length
        )
          return null;
        const [x1, y1] = salonCoordinates[index1];
        const [x2, y2] = salonCoordinates[index2];
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        return (
          <g key={key}>
            <line
              x1={x1 * scale}
              y1={y1 * scale}
              x2={x2 * scale}
              y2={y2 * scale}
              stroke="black"
              strokeWidth="2"
            />
            <text
              x={midX * scale}
              y={midY * scale}
              fill="black"
              fontSize="12"
              textAnchor="middle"
              onClick={(e) => onEditDistance(index1, index2, e)}
            >
              {distances[key].toFixed(2)} m
            </text>
          </g>
        );
      })}
    </>
  );
};

export default PolygonEditor;
