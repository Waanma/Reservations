import React from 'react';

interface EditorHeaderProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onSave: () => void;
}

const PerimeterHeader: React.FC<EditorHeaderProps> = ({
  zoom,
  setZoom,
  onSave,
}) => {
  return (
    <header
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <h2 style={{ margin: 0 }}>Perimeter Editor</h2>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label htmlFor="zoomRange" style={{ marginRight: '0.5rem' }}>
          Zoom:
        </label>
        <input
          id="zoomRange"
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          style={{ marginRight: '1rem' }}
        />
        <button
          onClick={onSave}
          style={{
            backgroundColor: 'green',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Save
        </button>
      </div>
    </header>
  );
};

export default PerimeterHeader;
