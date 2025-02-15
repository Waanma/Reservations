import React from 'react';

interface EditorHeaderProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  toggleEditMode: () => void;
  onSwitchToPerimeter: () => void;
}

const FiguresHeader: React.FC<EditorHeaderProps> = ({
  zoom,
  setZoom,
  toggleEditMode,
  onSwitchToPerimeter,
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
      <h2 style={{ margin: 0 }}>Figure Editor</h2>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={toggleEditMode}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '1rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Toggle Editing
        </button>
        <button
          onClick={onSwitchToPerimeter}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '1rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          disabled={false} // Aquí podrías controlar el disabled según tu lógica
        >
          Edit Perimeter
        </button>
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
          style={{ marginRight: '1rem' }}
        />
      </div>
    </header>
  );
};

export default FiguresHeader;
