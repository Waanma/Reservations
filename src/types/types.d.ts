export type Table = {
    id: string;
    name: string;
    shape: 'rect' | 'circle'; // Shape of the table (rectangular or circular)
    x: number; // Position in meters
    y: number;
    width: number; // Width in meters (if rectangular)
    height: number; // Height in meters (if rectangular)
    radius: number; // Radius in meters (if circular)
  };
  
  export type Salon = {
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
  