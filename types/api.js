export {}
// Alternative approach using branded types for stricter type safety
// export type RouteId = number & { readonly __brand: unique symbol };
// export type NavigationId = number & { readonly __brand: unique symbol };
// Use these for strict ID typing if needed:
// export type RouteWithStrictId = Omit<Route, 'id'> & { id: RouteId };
