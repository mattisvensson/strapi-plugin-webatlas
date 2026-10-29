import { Dispatch, SetStateAction, createContext } from 'react'
import { ConfigContentType, NestedNavigation } from '../../../types'

type ModalContextType = {
	modalType: string
	setModalType: Dispatch<SetStateAction<string>>
}

type SelectedNavigationContextType = {
	selectedNavigation: NestedNavigation | undefined
	setSelectedNavigation: Dispatch<SetStateAction<NestedNavigation | undefined>>
}

type ContentTypesContextType = {
	contentTypes: ConfigContentType[]
}

export const ModalContext = createContext<ModalContextType>({
	modalType: '',
	setModalType: () => {},
})
export const SelectedNavigationContext = createContext<SelectedNavigationContextType>({
	selectedNavigation: undefined,
	setSelectedNavigation: () => {},
})
export const ContentTypesContext = createContext<ContentTypesContextType>({
	contentTypes: [],
})
