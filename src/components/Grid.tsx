import React from 'react';

interface GridProps {
  scale: number;
  width: number;
  height: number;
  salonXs: number[];
  salonYs: number[];
}

const Grid: React.FC<GridProps> = ({
  scale,
  width,
  height,
  salonXs,
  salonYs,
}) => {
  const gridMinX = Math.floor(Math.min(0, ...salonXs));
  const gridMaxX = Math.ceil(Math.max(width / scale, ...salonXs));
  const gridMinY = Math.floor(Math.min(0, ...salonYs));
  const gridMaxY = Math.ceil(Math.max(height / scale, ...salonYs));

  const gridVerticalLines = [];
  for (let x = gridMinX; x <= gridMaxX; x++) {
    gridVerticalLines.push(
      <line
        key={`v-${x}`}
        x1={x * scale}
        y1={gridMinY * scale}
        x2={x * scale}
        y2={gridMaxY * scale}
        stroke="#ccc"
        strokeWidth="1"
      />
    );
  }

  const gridHorizontalLines = [];
  for (let y = gridMinY; y <= gridMaxY; y++) {
    gridHorizontalLines.push(
      <line
        key={`h-${y}`}
        x1={gridMinX * scale}
        y1={y * scale}
        x2={gridMaxX * scale}
        y2={y * scale}
        stroke="#ccc"
        strokeWidth="1"
      />
    );
  }

  return (
    <g>
      {gridVerticalLines}
      {gridHorizontalLines}
    </g>
  );
};

export default Grid;
