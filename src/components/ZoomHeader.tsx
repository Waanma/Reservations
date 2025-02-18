// ZoomHeader.tsx
import React from 'react';

interface ZoomHeaderProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

const ZoomHeader: React.FC<ZoomHeaderProps> = ({ zoom, setZoom }) => {
  return (
    <header
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <label htmlFor="zoomRange" style={{ marginRight: '0.5rem' }}>
        Zoom:
      </label>
      <input
        id="zoomRange"
        type="range"
        min="0.1"
        max="3"
        step="0.1"
        value={zoom}
        onChange={(e) => setZoom(parseFloat(e.target.value))}
      />
      <span>{zoom.toFixed(1)}x</span>
    </header>
  );
};

export default ZoomHeader;
