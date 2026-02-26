import type { NestedNavItem, NestedNavigation } from '../../../types';

export type RouteItemProps = {
  item: NestedNavItem;
  setActionItemParent: (item: NestedNavItem | null) => void;
  setActionItem: React.Dispatch<React.SetStateAction<NestedNavItem | NestedNavigation | undefined>>;
  setNavigationItems: React.Dispatch<React.SetStateAction<NestedNavItem[] | undefined>>;
  ghost?: boolean;
  depth?: number;
  maxDepth: number;
  style?: React.CSSProperties;
  wrapperRef?(node: HTMLLIElement): void;
  handleProps?: any;
  disableInteraction?: boolean;
  indentationWidth?: number;
}
