import { NavItem, Route } from '../types';

export default function isNavItem(item: NavItem | Route): item is NavItem {
  return (item as NavItem).slug !== undefined; // replace 'someProperty' with a property that only exists on NavItem
}
