import { CSSProperties } from 'react';

export const activeButtonStyle: CSSProperties = {
  backgroundColor: '#007bff', // color de fondo para el botón activo
  color: '#fff', // texto blanco
  padding: '0.5rem 1rem',
  border: '1px solid #007bff',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
};

export const inactiveButtonStyle: CSSProperties = {
  backgroundColor: '#f8f9fa', // color de fondo para el botón inactivo
  color: '#333', // texto en color oscuro
  padding: '0.5rem 1rem',
  border: '1px solid #007bff',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
};
