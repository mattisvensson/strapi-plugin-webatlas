
export default function getNestedNavigation(data: any) {
    const itemsById = new Map<number, any>();
    const rootItems: any[] = [];
  
    // First pass: create a map of all items by id and initialize their items array
    data.items.forEach(item => {
      itemsById.set(item.id, { ...item, items: [] });
    });
  
    // Second pass: assign items to their parent's items array or to the root items array
    data.items.forEach(item => {
      const newItem = itemsById.get(item.id);
      if (item.parent) {
        const parentItem = itemsById.get(item.parent.id);
        parentItem.items.push(newItem);
      } else {
        rootItems.push(newItem);
      }
    });
  
    // Return a new object with the nested items
    return { ...data, items: rootItems };
  }