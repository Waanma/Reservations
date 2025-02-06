import { create } from 'zustand';
import { Salon, Table, Config } from '../types/types';

type Store = {
  salon: Salon;
  setSalon: (salon: Salon) => void;
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
