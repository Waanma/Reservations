import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    xmlns?: string;
  }
}
