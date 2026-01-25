import type { Route } from '../../../../types';
import type { RouteSortKey } from '../../types';

export default function compareBy(field: RouteSortKey, direction: 'asc' | 'desc') {
  if (!field) {
    return () => 0;
  }
  if (field === 'type') {
    return (a: Route, b: Route) => {
      return direction === 'asc'
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type);
    };
  }
  return (a: Route, b: Route) => {
    const aValue = a[field];
    const bValue = b[field];
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return 0;
  };
}