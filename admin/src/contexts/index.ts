import { Dispatch, SetStateAction, createContext } from 'react'
import { GroupedEntities, NestedNavigation } from '../../../types'

type ModalContextType = {
	modalType: string
	setModalType: Dispatch<SetStateAction<string>>
}

type SelectedNavigationContextType = {
	selectedNavigation: NestedNavigation | undefined
	setSelectedNavigation: Dispatch<SetStateAction<NestedNavigation | undefined>>
}

type EntitiesContextType = {
	entities: GroupedEntities[]
	loadEntities: () => void
}

export const ModalContext = createContext<ModalContextType>({
	modalType: '',
	setModalType: () => {},
})
export const SelectedNavigationContext = createContext<SelectedNavigationContextType>({
	selectedNavigation: undefined,
	setSelectedNavigation: () => {},
})
export const EntitiesContext = createContext<EntitiesContextType>({
	entities: [],
	loadEntities: () => {},
})
