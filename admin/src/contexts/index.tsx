import { Dispatch, SetStateAction, createContext } from 'react';
import { NestedNavigation } from '../../../types';

type ModalContextType = [string, Dispatch<SetStateAction<string>>];
type SelectedNavigationContextType = [NestedNavigation | undefined, React.Dispatch<React.SetStateAction<NestedNavigation | undefined>>];

export const ModalContext = createContext<ModalContextType | null>(null);
export const SelectedNavigationContext = createContext<SelectedNavigationContextType>([undefined, () => {}]);