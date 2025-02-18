import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Perimeter, Figure, Config } from '../types/types';

type Store = {
  perimeter: Perimeter;
  setPerimeter: (perimeter: Perimeter) => void;
  figures: Figure[];
  setFigures: (value: React.SetStateAction<Figure[]>) => void;
  config: Config;
  setConfig: (config: Config) => void;
};

export const useStore = create<Store, [['zustand/persist', Store]]>(
  persist(
    (set) => ({
      perimeter: {
        coordinates: [
          [0, 0],
          [10, 0],
          [10, 5],
          [0, 5],
        ],
        setCoordinates: (coordinates: number[][]) =>
          set((state) => ({
            perimeter: { ...state.perimeter, coordinates },
          })),
      },
      setPerimeter: (perimeter: Perimeter) => set({ perimeter }),
      figures: [],
      setFigures: (value: React.SetStateAction<Figure[]>) =>
        set((state) => ({
          figures:
            typeof value === 'function'
              ? (value as (prev: Figure[]) => Figure[])(state.figures)
              : value,
        })),
      config: {
        reservationTime: 30,
        timeBetweenReservations: 15,
        pricingSchedule: [],
      },
      setConfig: (config: Config) => set({ config }),
    }),
    { name: 'my-app-store' }
  )
);
