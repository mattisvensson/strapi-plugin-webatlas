import { Dispatch, SetStateAction, createContext } from 'react';
import { NestedNavigation } from '../../../types';

type ModalContextType = {
  modalType: string;
  setModalType: Dispatch<SetStateAction<string>>;
};

type SelectedNavigationContextType = {
  selectedNavigation: NestedNavigation | undefined, 
  setSelectedNavigation: Dispatch<SetStateAction<NestedNavigation | undefined>>
};

export const ModalContext = createContext<ModalContextType>({modalType: '', setModalType: () => {}});
export const SelectedNavigationContext = createContext<SelectedNavigationContextType>({ selectedNavigation: undefined, setSelectedNavigation: () => {}});