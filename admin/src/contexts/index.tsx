import { Dispatch, SetStateAction, createContext } from 'react';
import { NavItem } from '../types';

type ModalContextType = [string, Dispatch<SetStateAction<string>>];
type SelectedNavigationContextType = [NavItem | undefined, React.Dispatch<React.SetStateAction<NavItem | undefined>>];

export const ModalContext = createContext<ModalContextType | null>(null);
export const SelectedNavigationContext = createContext<SelectedNavigationContextType>([undefined, () => {}]);