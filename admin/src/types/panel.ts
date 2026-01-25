export type PanelAction = 
  | { type: 'DEFAULT'; payload: string }
  | { type: 'NO_URL_CHECK'; payload: string }
  | { type: 'NO_TRANSFORM_AND_CHECK'; payload: string }
  | { type: 'RESET_URL_CHECK_FLAG'; }
  | { type: 'SET_UIDPATH'; payload: string }

export type PanelPathState = {
  value?: string;
  prevValue?: string,
  uIdPath?: string,
  needsUrlCheck: boolean;
};