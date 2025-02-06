'use client';

import React, { useState } from 'react';
import { Config, PricingSlot } from '../types/types';

const Configuration: React.FC = () => {
  const [config, setConfig] = useState<Config>({
    reservationTime: 30,
    timeBetweenReservations: 15,
    pricingSchedule: [
      { day: 'Monday', startTime: '08:00', endTime: '12:00', price: 50 },
      { day: 'Monday', startTime: '12:00', endTime: '18:00', price: 60 },
    ],
  });

  const handleConfigChange = (
    key: keyof Config,
    value: number | PricingSlot[]
  ) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [key]: value,
    }));
  };

  return (
    <div>
      <h3>Configuration</h3>
      <div>
        <label>Reservation Time (minutes):</label>
        <input
          type="number"
          value={config.reservationTime}
          onChange={(e) =>
            handleConfigChange('reservationTime', Number(e.target.value))
          }
        />
      </div>
      <div>
        <label>Time Between Reservations (minutes):</label>
        <input
          type="number"
          value={config.timeBetweenReservations}
          onChange={(e) =>
            handleConfigChange(
              'timeBetweenReservations',
              Number(e.target.value)
            )
          }
        />
      </div>
      <div>
        <h4>Pricing Schedule</h4>
        {config.pricingSchedule.map((slot, index) => (
          <div key={index}>
            <span>
              {slot.day} {slot.startTime} - {slot.endTime} - ${slot.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Configuration;
