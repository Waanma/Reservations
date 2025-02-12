import { create } from 'zustand';
import { Perimeter, Table, Config } from '../types/types';

type Store = {
  salon: Perimeter;
  setSalon: (salon: Perimeter) => void;
  tables: Table[];
  setTables: (tables: Table[]) => void;
  config: Config;
  setConfig: (config: Config) => void;
};

export const useStore = create<Store>((set) => ({
  salon: {
    coordinates: [
      [0, 0],
      [10, 0],
      [10, 5],
      [5, 5],
      [5, 0],
    ],
    setCoordinates: (coordinates) =>
      set((state) => ({
        salon: { ...state.salon, coordinates },
      })),
  },
  setSalon: (salon) => set({ salon }),
  tables: [],
  setTables: (tables) => set({ tables }),
  config: {
    reservationTime: 30,
    timeBetweenReservations: 15,
    pricingSchedule: [],
  },
  setConfig: (config) => set({ config }),
}));
