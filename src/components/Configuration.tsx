'use client';

import React, { useState } from 'react';
import { Config, PricingSlot } from '../types/types';

// Array con los días de la semana
const daysOfWeek: string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const Configuration: React.FC = () => {
  const [config, setConfig] = useState<Config>({
    reservationTime: 30,
    timeBetweenReservations: 15,
    pricingSchedule: [
      { day: 'Monday', startTime: '08:00', endTime: '12:00', price: 50 },
      { day: 'Monday', startTime: '12:00', endTime: '18:00', price: 60 },
    ],
  });

  // Actualiza la propiedad indicada de la configuración
  const handleConfigChange = (
    key: keyof Config,
    value: number | PricingSlot[]
  ) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [key]: value,
    }));
  };

  // Actualiza un campo específico de un pricing slot
  const handlePricingSlotChange = (
    index: number,
    field: keyof PricingSlot,
    value: string | number
  ) => {
    const updatedSchedule = config.pricingSchedule.map((slot, idx) => {
      if (idx === index) {
        return { ...slot, [field]: value };
      }
      return slot;
    });
    handleConfigChange('pricingSchedule', updatedSchedule);
  };

  // Agrega un nuevo pricing slot con valores iniciales
  const addPricingSlot = () => {
    const newSlot: PricingSlot = {
      day: 'Monday', // Valor por defecto, se puede modificar con el selector
      startTime: '00:00',
      endTime: '00:00',
      price: 0,
    };
    handleConfigChange('pricingSchedule', [...config.pricingSchedule, newSlot]);
  };

  // Elimina un pricing slot por su índice
  const removePricingSlot = (index: number) => {
    const updatedSchedule = config.pricingSchedule.filter(
      (_, idx) => idx !== index
    );
    handleConfigChange('pricingSchedule', updatedSchedule);
  };

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-3xl font-semibold text-gray-800 mb-8">
        Configuration
      </h3>

      {/* Reservation Time */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Reservation Time (minutes):
        </label>
        <input
          type="number"
          value={config.reservationTime}
          onChange={(e) =>
            handleConfigChange('reservationTime', Number(e.target.value))
          }
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Time Between Reservations */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Time Between Reservations (minutes):
        </label>
        <input
          type="number"
          value={config.timeBetweenReservations}
          onChange={(e) =>
            handleConfigChange(
              'timeBetweenReservations',
              Number(e.target.value)
            )
          }
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Pricing Schedule */}
      <div>
        <h4 className="text-2xl font-semibold text-gray-800 mb-6">
          Pricing Schedule
        </h4>
        {config.pricingSchedule.map((slot, index) => (
          <div
            key={index}
            className="mb-6 p-4 border border-gray-200 rounded shadow-sm"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Day */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Day:
                </label>
                <select
                  value={slot.day}
                  onChange={(e) =>
                    handlePricingSlotChange(index, 'day', e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Start Time:
                </label>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) =>
                    handlePricingSlotChange(index, 'startTime', e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  End Time:
                </label>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) =>
                    handlePricingSlotChange(index, 'endTime', e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Price:
                </label>
                <input
                  type="number"
                  value={slot.price}
                  onChange={(e) =>
                    handlePricingSlotChange(
                      index,
                      'price',
                      Number(e.target.value)
                    )
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => removePricingSlot(index)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                Remove Slot
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addPricingSlot}
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Add Pricing Slot
        </button>
      </div>
    </div>
  );
};

export default Configuration;
