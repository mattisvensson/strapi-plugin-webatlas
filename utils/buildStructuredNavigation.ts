import { NestedNavigation, NestedNavItem, StructuredNavigationVariant } from "../types";

export default function buildStructuredNavigation(data: NestedNavigation, variant: StructuredNavigationVariant = 'nested') {
  const itemsById = new Map<number, NestedNavItem>();
  const rootItems: NestedNavItem[] = [];

  // First pass: create a map of all items by id and initialize their items array
  data.items.forEach(item => {
    itemsById.set(item.id, { ...item, items: [] });
  });

  if (variant === 'nested') {
    // Second pass: assign items to their parent's items array or to the root items array
    data.items.forEach(item => {
      const newItem = itemsById.get(item.id);
      if (!newItem) return null
      if (item.parent) {
        const parentItem = itemsById.get(item.parent.id);
        parentItem && parentItem.items.push(newItem);
      } else {
        rootItems.push(newItem);
      }
    });

    // Sort root items and their nested items
    sortItems(rootItems);

    // Return a new object with the nested and sorted items
    return { ...data, items: rootItems };
  } else if (variant === 'flat') {
    // Assign items to their parent's items array or to the root items array
    let itemsToProcess = [...data.items];
    let itemsProcessed = new Set();

    while (itemsToProcess.length > 0) {
      const remainingItems: NestedNavItem[] = [];

      itemsToProcess.forEach(item => {
        const newItem = itemsById.get(item.id);
        if (!newItem) return null;

        if (item.parent) {
          const parentItem = itemsById.get(item.parent.id);

          if (!parentItem || !itemsProcessed.has(item.parent.id)) {
            // Defer processing this item until the parent is processed
            remainingItems.push(item);
            return;
          }

          newItem.depth = parentItem.depth !== undefined ? parentItem.depth + 1 : 0;
          parentItem.items.push(newItem);
        } else {
          newItem.depth = 0;
          rootItems.push(newItem);
        }

        itemsById.set(item.id, newItem);
        itemsProcessed.add(item.id);
      });

      itemsToProcess = remainingItems;
    }
    // Flatten and sort the items
    const sortedItems = sortItems(rootItems);
    const flattenedItems = flattenItems(sortedItems);
  
    // Return the sorted items
    return { ...data, items: flattenedItems };
  }
}

// Helper function to flatten the nested items into a sorted array
const flattenItems = (items: any[], result: any[] = []) => {
  items.forEach(item => {
    const itemCopy = { ...item }
    delete itemCopy.items
    result.push(itemCopy)

    if (item.items && item.items.length > 0) {
      flattenItems(item.items, result);
    }
  });
  return result;
};

// Helper function to sort items by route.order
const sortItems = (items: NestedNavItem[]) => {
  items.sort((a, b) => a.order - b.order);
  items.forEach(item => {
    if (item.items && item.items.length > 0) {
      sortItems(item.items);
    }
  });

  return items
};

