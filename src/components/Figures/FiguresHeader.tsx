import React from 'react';

interface EditorHeaderProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  toggleEditMode: () => void;
  onSwitchToPerimeter: () => void;
  // Si es true, ocultamos los botones de edición
  hideEditingControls?: boolean;
}

const FiguresHeader: React.FC<EditorHeaderProps> = ({
  zoom,
  setZoom,
  toggleEditMode,
  onSwitchToPerimeter,
  hideEditingControls = false,
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
      {/* Solo se muestran controles de edición si hideEditingControls es false */}
      {!hideEditingControls && (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={toggleEditMode}
            style={{
              padding: '0.5rem 1rem',
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
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Edit Perimeter
          </button>
        </div>
      )}

      {/* Control de Zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label htmlFor="zoomRange">Zoom:</label>
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
      </div>
    </header>
  );
};

export default FiguresHeader;
