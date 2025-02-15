export type Table = {
  id: number;
  name: string;
  shape: 'rect' | 'circle'; // Mesa rectangular o redonda
  x: number; // posición en metros (esquina superior izquierda o centro)
  y: number;
  width?: number; // Solo aplica para mesas rectangulares
  height?: number; // Solo aplica para mesas rectangulares
  radius?: number; // Solo aplica para mesas redondas
};

export type Perimeter = {
  coordinates: number[][]; // Coordinates defining the shape of the salon
  setCoordinates: (coordinates: number[][]) => void; // Function to update salon coordinates
};

export type Config = {
  reservationTime: number; // In minutes
  timeBetweenReservations: number; // In minutes
  pricingSchedule: PricingSlot[]; // Pricing slots for each day
};

export type PricingSlot = {
  day: string;
  startTime: string;
  endTime: string;
  price: number;
};

export type PricingSchedule = {
  day: string;
  startTime: string;
  endTime: string;
  price: number;
};

// Tipo para las reglas de fusión
interface MergeRule {
  mergeFrom: number[]; // IDs de las figuras base
  mergeInto: number; // ID de la figura fusionada (predefinida)
  activeFrom: string; // Hora de inicio ("HH:MM")
  activeTo: string; // Hora de fin ("HH:MM")
}

export type FigureEditorProps = {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  scale: number;
  zoom: number;
  svgSize: { width: number; height: number };
  position: { x: number; y: number };
  salonPolygon: number[][] | null;
  onSwitchToPerimeter: () => void;
  handlePanMouseDown: (e: React.MouseEvent<Element, MouseEvent>) => void;
  showGrid?: boolean;
};
