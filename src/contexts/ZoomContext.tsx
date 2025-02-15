import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ZoomContextProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

const ZoomContext = createContext<ZoomContextProps | undefined>(undefined);

export const ZoomProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [zoom, setZoom] = useState(1);

  return (
    <ZoomContext.Provider value={{ zoom, setZoom }}>
      {children}
    </ZoomContext.Provider>
  );
};

export const useZoomContext = () => {
  const context = useContext(ZoomContext);
  if (!context) {
    throw new Error('useZoomContext must be used within a ZoomProvider');
  }
  return context;
};
