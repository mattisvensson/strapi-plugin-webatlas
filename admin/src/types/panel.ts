import { Route } from "../../../types";

export type PanelAction = 
  | { type: 'DEFAULT'; payload: string }
  | { type: 'NO_URL_CHECK'; payload: string }
  | { type: 'NO_TRANSFORM_AND_CHECK'; payload: string }
  | { type: 'RESET_URL_CHECK_FLAG'; }
  | { type: 'SET_REPLACEMENT'; payload: string }
  | { type: 'SET_UIDPATH'; payload: string }
  | { type: 'SET_CANONICALPATH'; payload: string }

export type PanelPathState = {
  value?: string;
  prevValue?: string,
  uIdPath?: string,
  needsUrlCheck: boolean;
  replacement: string | null;
  canonicalPath?: string;
};

export type RouteStructureProps = {
  canonicalPath?: string;
  routeId: string | null;
  routes: Route[];
  selectedParent: Route | null;
  setSelectedParent: (value: Route | null) => void;
}