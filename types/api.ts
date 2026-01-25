
// Generic API patterns - you can use these throughout your app
export type ApiEntity<TData, TSystemFields = {}> = TData & TSystemFields & {
  id: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiCreateInput<TData> = Omit<TData, 'id' | 'createdAt' | 'updatedAt'>;
export type ApiUpdateInput<TData> = Partial<ApiCreateInput<TData>>;

// Alternative approach using branded types for stricter type safety
// export type RouteId = number & { readonly __brand: unique symbol };
// export type NavigationId = number & { readonly __brand: unique symbol };

// Use these for strict ID typing if needed:
// export type RouteWithStrictId = Omit<Route, 'id'> & { id: RouteId };
