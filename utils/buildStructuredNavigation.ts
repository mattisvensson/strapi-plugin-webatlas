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

    // Helper function to sort items by route.order
    // const sortItems = (items: NestedNavItem[]) => {
    //   items.sort((a, b) => a.route.order - b.route.order);
    //   items.forEach(item => {
    //     if (item.items.length > 0) {
    //       sortItems(item.items);
    //     }
    //   });
    // };

    // Sort root items and their nested items
    // sortItems(rootItems);

    // Return a new object with the nested and sorted items
    return { ...data, items: rootItems };
  } else if (variant === 'flat') {
    // Second pass: assign items to their parent's items array or to the root items array
    data.items.forEach(item => {
      const newItem = itemsById.get(item.id);
      if (!newItem) return null
      if (item.parent) {
        const parentItem = itemsById.get(item.parent.id);

        if (!parentItem) return rootItems.push(newItem);

        newItem.depth = parentItem.depth ? parentItem.depth + 1 : 0;
        parentItem.items.push(newItem);
      } else {
        newItem.depth = 0;
        rootItems.push(newItem);
      }
      itemsById.set(item.id, newItem);
    });

    // Flatten and sort the items
    const sortedItems = flattenItems(rootItems);
  
    // Return the sorted items
    return { ...data, items: sortedItems };
  }
}

// Helper function to flatten the nested items into a sorted array
const flattenItems = (items: any[], result: any[] = []) => {
  items.forEach(item => {
    result.push({ ...item, items: [] }); // Avoid adding nested items
    if (item.items.length > 0) {
      flattenItems(item.items, result);
    }
  });
  return result;
};

