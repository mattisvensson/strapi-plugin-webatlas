import { NestedNavItem } from '../../../types';

export default function countChildren(item: NestedNavItem): number {
  if (!item.items || item.items.length === 0) {
    return 0;
  }

  let count = item.items.length;

  for (const child of item.items) {
    count += countChildren(child);
  }

  return count;
}