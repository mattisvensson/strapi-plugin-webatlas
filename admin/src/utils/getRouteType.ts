import type { Route } from "../../../types";

export default function getRouteType(route: Route): 'internal' | 'external' | 'wrapper' {
  if (route.wrapper) {
    return 'wrapper';
  } else if (!route.internal) {
    return 'external';
  } else {
    return 'internal';
  }
}