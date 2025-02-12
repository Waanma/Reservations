'use client';

import React, { useState } from 'react';

interface ConfigurationProps {
  onClose: () => void;
}

// Array con los días de la semana (en inglés, puedes adaptarlo)
const daysOfWeek: string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface PricingSlot {
  startTime: string;
  endTime: string;
  price: number;
}

interface PricingDay {
  day: string;
  slots: PricingSlot[];
}

interface Config {
  reservationTime: number;
  timeBetweenReservations: number;
  pricingSchedule: PricingDay[];
}

const Configuration: React.FC<ConfigurationProps> = () => {
  const [config, setConfig] = useState<Config>({
    reservationTime: 30,
    timeBetweenReservations: 15,
    pricingSchedule: [
      {
        day: 'Monday',
        slots: [{ startTime: '00:00', endTime: '00:00', price: 0 }],
      },
    ],
  });

  const handleReservationTimeChange = (value: number) => {
    setConfig((prev) => ({ ...prev, reservationTime: value }));
  };

  const handleTimeBetweenReservationsChange = (value: number) => {
    setConfig((prev) => ({ ...prev, timeBetweenReservations: value }));
  };

  const handleDayChange = (dayIndex: number, newDay: string) => {
    const updatedSchedule = config.pricingSchedule.map((pricingDay, index) =>
      index === dayIndex ? { ...pricingDay, day: newDay } : pricingDay
    );
    setConfig({ ...config, pricingSchedule: updatedSchedule });
  };

  const handleSlotChange = (
    dayIndex: number,
    slotIndex: number,
    field: keyof PricingSlot,
    value: string | number
  ) => {
    const updatedSchedule = config.pricingSchedule.map((pricingDay, dIndex) => {
      if (dIndex === dayIndex) {
        const updatedSlots = pricingDay.slots.map((slot, sIndex) =>
          sIndex === slotIndex ? { ...slot, [field]: value } : slot
        );
        return { ...pricingDay, slots: updatedSlots };
      }
      return pricingDay;
    });
    setConfig({ ...config, pricingSchedule: updatedSchedule });
  };

  const addSlot = (dayIndex: number) => {
    const newSlot: PricingSlot = {
      startTime: '00:00',
      endTime: '00:00',
      price: 0,
    };
    const updatedSchedule = config.pricingSchedule.map((pricingDay, dIndex) => {
      if (dIndex === dayIndex) {
        return { ...pricingDay, slots: [...pricingDay.slots, newSlot] };
      }
      return pricingDay;
    });
    setConfig({ ...config, pricingSchedule: updatedSchedule });
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const updatedSchedule = config.pricingSchedule.map((pricingDay, dIndex) => {
      if (dIndex === dayIndex) {
        const updatedSlots = pricingDay.slots.filter(
          (_, sIndex) => sIndex !== slotIndex
        );
        return { ...pricingDay, slots: updatedSlots };
      }
      return pricingDay;
    });
    setConfig({ ...config, pricingSchedule: updatedSchedule });
  };

  const addDay = () => {
    const newDay: PricingDay = {
      day: 'Monday',
      slots: [{ startTime: '00:00', endTime: '00:00', price: 0 }],
    };
    setConfig({
      ...config,
      pricingSchedule: [...config.pricingSchedule, newDay],
    });
  };

  const removeDay = (dayIndex: number) => {
    const updatedSchedule = config.pricingSchedule.filter(
      (_, index) => index !== dayIndex
    );
    setConfig({ ...config, pricingSchedule: updatedSchedule });
  };

  return (
    <div className="relative p-4 max-h-[80vh] overflow-y-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Setting prices by time
      </h3>

      {/* Botón para agregar un día */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={addDay}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Add Day
        </button>
      </div>

      {/* Bloques por cada día */}
      {config.pricingSchedule.map((pricingDay, dayIndex) => (
        <div key={dayIndex} className="mb-4 border border-gray-200 rounded p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="w-1/2">
              <label className="block text-gray-700 font-medium mb-1">
                Day:
              </label>
              <select
                value={pricingDay.day}
                onChange={(e) => handleDayChange(dayIndex, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {daysOfWeek.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={() => removeDay(dayIndex)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                Delete Day
              </button>
            </div>
          </div>

          {/* Franjas horarias */}
          {pricingDay.slots.map((slot, slotIndex) => (
            <div
              key={slotIndex}
              className="grid grid-cols-4 gap-2 items-end mb-2"
            >
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Start at:
                </label>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) =>
                    handleSlotChange(
                      dayIndex,
                      slotIndex,
                      'startTime',
                      e.target.value
                    )
                  }
                  className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  End at:
                </label>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) =>
                    handleSlotChange(
                      dayIndex,
                      slotIndex,
                      'endTime',
                      e.target.value
                    )
                  }
                  className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Price:
                </label>
                <input
                  type="number"
                  value={slot.price}
                  onChange={(e) =>
                    handleSlotChange(
                      dayIndex,
                      slotIndex,
                      'price',
                      Number(e.target.value)
                    )
                  }
                  className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <button
                  onClick={() => removeSlot(dayIndex, slotIndex)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => addSlot(dayIndex)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Add time slot
          </button>
        </div>
      ))}

      {/* Campos adicionales */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-1">
          Reservation time (minutes):
        </label>
        <input
          type="number"
          value={config.reservationTime}
          onChange={(e) => handleReservationTimeChange(Number(e.target.value))}
          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-1">
          Time between reservations (minutes):
        </label>
        <input
          type="number"
          value={config.timeBetweenReservations}
          onChange={(e) =>
            handleTimeBetweenReservationsChange(Number(e.target.value))
          }
          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
    </div>
  );
};

export default Configuration;
