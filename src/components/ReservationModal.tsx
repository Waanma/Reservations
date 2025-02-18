import React, { useState } from 'react';
import mockData from '@/public/data/mockData.json';
import { Figure } from '@/types/types';

interface ScheduleOption {
  id: number;
  day: string;
  time: string; // Hora de inicio en formato "HH:MM"
  price: number;
}

interface ReservationModalProps {
  selectedFigure: Figure;
  onClose: () => void;
  onReserve: (selectedOptionIds: number[]) => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  selectedFigure,
  onClose,
  onReserve,
}) => {
  const { reservationTime, timeBetweenReservations, pricingSchedule } =
    mockData.config;

  // Función para convertir "HH:MM" a minutos
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Función para formatear minutos a "HH:MM"
  const formatTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Genera las opciones de reserva para cada registro en pricingSchedule
  const generateOptions = (): ScheduleOption[] => {
    const options: ScheduleOption[] = [];
    let idCounter = 1;
    pricingSchedule.forEach((record) => {
      const day = record.day;
      const start = timeToMinutes(record.startTime);
      const end = timeToMinutes(record.endTime);
      const price = record.price;
      let slotStart = start;
      while (slotStart + reservationTime <= end) {
        options.push({
          id: idCounter++,
          day,
          time: formatTime(slotStart),
          price,
        });
        // Suma el tiempo de reserva más el intervalo entre reservas
        slotStart += reservationTime + timeBetweenReservations;
      }
    });
    return options;
  };

  const allOptions: ScheduleOption[] = generateOptions();

  // Estados para filtros y selección de opciones
  const [dayFilter, setDayFilter] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('');
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);

  const filteredOptions = allOptions.filter((option) => {
    const matchDay = dayFilter ? option.day === dayFilter : true;
    const matchTime = timeFilter ? option.time === timeFilter : true;
    return matchDay && matchTime;
  });

  const toggleOption = (id: number) => {
    setSelectedOptionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setDayFilter('');
    setTimeFilter('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg min-w-[400px] max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-transparent border-none text-2xl cursor-pointer"
        >
          &times;
        </button>
        <h2 className="mb-4 text-lg font-bold">
          Reservar {selectedFigure.name}
        </h2>
        {/* Filtros intuitivos */}
        <div className="flex flex-col md:flex-row md:items-end md:gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter per day:
            </label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="bg-gray-200 border border-gray-300 rounded-md p-2 w-full"
            >
              <option value="">All</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter per hour:
            </label>
            <input
              type="time"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-gray-200 border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div>
            <button
              onClick={resetFilters}
              className="mt-1 md:mt-0 px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Reset Filter
            </button>
          </div>
        </div>
        {/* Tabla de opciones de reserva */}
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr>
              <th className="border p-2">Select</th>
              <th className="border p-2">Day</th>
              <th className="border p-2">Start Time</th>
              <th className="border p-2">End Time</th>
              <th className="border p-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {filteredOptions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-2">
                  No options available
                </td>
              </tr>
            ) : (
              filteredOptions.map((option) => {
                const slotStartMinutes = timeToMinutes(option.time);
                const slotEnd = formatTime(slotStartMinutes + reservationTime);
                return (
                  <tr key={option.id}>
                    <td className="border p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedOptionIds.includes(option.id)}
                        onChange={() => toggleOption(option.id)}
                      />
                    </td>
                    <td className="border p-2">{option.day}</td>
                    <td className="border p-2">{option.time}</td>
                    <td className="border p-2">{slotEnd}</td>
                    <td className="border p-2">{option.price} €</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Volver
          </button>
          <button
            onClick={() => {
              onReserve(selectedOptionIds);
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Reservar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;
