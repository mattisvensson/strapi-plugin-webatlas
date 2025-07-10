import { Dispatch, SetStateAction, createContext } from 'react';
import { NestedNavigation } from '../../../types';

type ModalContextType = {
  modal: string;
  setModal: Dispatch<SetStateAction<string>>;
};

type SelectedNavigationContextType = {
  selectedNavigation: NestedNavigation | undefined, 
  setSelectedNavigation: Dispatch<SetStateAction<NestedNavigation | undefined>>
};

export const ModalContext = createContext<ModalContextType>({modal: '', setModal: () => {}});
export const SelectedNavigationContext = createContext<SelectedNavigationContextType>({ selectedNavigation: undefined, setSelectedNavigation: () => {}});