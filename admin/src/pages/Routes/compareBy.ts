import type { Route, RouteSortKey } from '../../../../types';

export default function compareBy(field: RouteSortKey, direction: 'asc' | 'desc') {
  if (!field) {
    return () => 0;
  }
  if (field === 'type') {
    return (a: Route, b: Route) => {
      const typeA = a.internal ? 'internal' : 'external';
      const typeB = b.internal ? 'internal' : 'external';
      return direction === 'asc'
        ? typeA.localeCompare(typeB)
        : typeB.localeCompare(typeA);
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