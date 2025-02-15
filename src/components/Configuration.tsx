'use client';

import React, { useState } from 'react';

// --- Tipos ---
export interface MergeRule {
  mergeFrom: number[]; // IDs de las figuras a fusionar
  mergeInto: number; // ID de la figura resultante
  activeFrom: string; // Hora de inicio ("HH:MM")
  activeTo: string; // Hora de fin ("HH:MM")
}

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

const daysOfWeek: string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// --- Props del componente ---
// Se reciben la función de cierre, la lista de figuras (para los selectores de Merge Rules)
// y el estado de mergeRules con su setter (que provienen de FigureEditor)
interface ConfigurationProps {
  onClose: () => void;
  tables: { id: number; name: string }[];
  mergeRules: MergeRule[];
  setMergeRules: React.Dispatch<React.SetStateAction<MergeRule[]>>;
}

const Configuration: React.FC<ConfigurationProps> = ({
  onClose,
  tables,
  mergeRules,
  setMergeRules,
}) => {
  // Estado para la pestaña interna del modal: "pricing" o "merge"
  const [activeTab, setActiveTab] = useState<'pricing' | 'merge'>('pricing');

  // --- Lógica de Pricing Schedule ---
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

  // --- Lógica de Merge Rules ---
  // Para esta parte usamos el estado mergeRules y setMergeRules que llegan por props.
  const [newRule, setNewRule] = useState<MergeRule>({
    mergeFrom: [],
    mergeInto: 0,
    activeFrom: '15:00',
    activeTo: '18:00',
  });

  const handleAddRule = () => {
    if (newRule.mergeFrom.length === 0 || newRule.mergeInto === 0) {
      alert('Please select figures to merge and a resulting figure.');
      return;
    }
    setMergeRules([...mergeRules, newRule]);
    setNewRule({
      mergeFrom: [],
      mergeInto: 0,
      activeFrom: '15:00',
      activeTo: '18:00',
    });
  };

  return (
    <div className="relative p-4 max-h-[80vh] overflow-y-auto">
      {/* Botón de cierre en la esquina superior derecha */}
      <button
        onClick={onClose}
        className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700"
      >
        X
      </button>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Configuration
      </h3>
      {/* Tabs internas */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('pricing')}
          className={`py-2 px-4 ${
            activeTab === 'pricing'
              ? 'border-b-2 border-blue-500 font-bold'
              : ''
          }`}
        >
          Pricing Schedule
        </button>
        <button
          onClick={() => setActiveTab('merge')}
          className={`py-2 px-4 ${
            activeTab === 'merge' ? 'border-b-2 border-blue-500 font-bold' : ''
          }`}
        >
          Merge Rules
        </button>
      </div>
      {activeTab === 'pricing' ? (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={addDay}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Day
            </button>
          </div>
          {config.pricingSchedule.map((pricingDay, dayIndex) => (
            <div key={dayIndex} className="mb-4 border p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <div className="w-1/2">
                  <label className="block text-gray-700 font-medium mb-1">
                    Day:
                  </label>
                  <select
                    value={pricingDay.day}
                    onChange={(e) => handleDayChange(dayIndex, e.target.value)}
                    className="w-full p-2 border rounded"
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
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete Day
                  </button>
                </div>
              </div>
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
                      className="w-full p-1 border rounded"
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
                      className="w-full p-1 border rounded"
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
                      className="w-full p-1 border rounded"
                    />
                  </div>
                  <div>
                    <button
                      onClick={() => removeSlot(dayIndex, slotIndex)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addSlot(dayIndex)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Add time slot
              </button>
            </div>
          ))}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">
              Reservation time (minutes):
            </label>
            <input
              type="number"
              value={config.reservationTime}
              onChange={(e) =>
                handleReservationTimeChange(Number(e.target.value))
              }
              className="w-full p-1 border rounded"
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
              className="w-full p-1 border rounded"
            />
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Merge Rules Configuration
          </h3>
          {mergeRules.map((rule, index) => (
            <div key={index} className="mb-2 p-2 border rounded">
              <div>
                <span className="font-medium">Merge from:</span>{' '}
                {rule.mergeFrom.join(', ')}
              </div>
              <div>
                <span className="font-medium">Merge into:</span>{' '}
                {rule.mergeInto}
              </div>
              <div>
                <span className="font-medium">Active from:</span>{' '}
                {rule.activeFrom} <span className="font-medium">to:</span>{' '}
                {rule.activeTo}
              </div>
            </div>
          ))}
          <div className="mt-4 p-2 border rounded">
            <h4 className="font-semibold mb-2">New Merge Rule</h4>
            <div className="mb-2">
              <label className="block text-gray-700 font-medium mb-1">
                Figures to merge:
              </label>
              <select
                multiple
                value={newRule.mergeFrom.map(String)}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => Number(option.value)
                  );
                  setNewRule({ ...newRule, mergeFrom: selected });
                }}
                className="w-full p-2 border rounded"
              >
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.id} - {table.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 font-medium mb-1">
                Resulting figure:
              </label>
              <select
                value={newRule.mergeInto}
                onChange={(e) =>
                  setNewRule({ ...newRule, mergeInto: Number(e.target.value) })
                }
                className="w-full p-2 border rounded"
              >
                <option value={0}>Select a figure</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.id} - {table.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-2 flex gap-2">
              <div className="w-1/2">
                <label className="block text-gray-700 font-medium mb-1">
                  Active from:
                </label>
                <input
                  type="time"
                  value={newRule.activeFrom}
                  onChange={(e) =>
                    setNewRule({ ...newRule, activeFrom: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700 font-medium mb-1">
                  Active to:
                </label>
                <input
                  type="time"
                  value={newRule.activeTo}
                  onChange={(e) =>
                    setNewRule({ ...newRule, activeTo: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <button
              onClick={handleAddRule}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Add Merge Rule
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuration;
