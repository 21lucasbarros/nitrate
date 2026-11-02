// Espelha PageDTO do backend. `page` começa em 0.
export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}
