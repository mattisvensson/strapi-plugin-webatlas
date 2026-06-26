import { useState, forwardRef, useEffect } from 'react'
import { Field, Combobox, ComboboxOption, Box } from '@strapi/design-system'
import { ExternalLink, Link } from '@strapi/icons'
import { useApi } from '../../hooks'
import { Route } from '../../../../types'

interface InputProps {
	attribute: {
		type: string
	}
	disabled?: boolean
	placeholder?: string
	label: string
	intlLabel: {
		id: string
		defaultMessage: string
	}
	name: string
	onChange: (event: { target: { name: string; type: string; value: string } }) => void
	required?: boolean
	value?: string
	hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
	const { attribute, disabled, placeholder, label, name, onChange, required, value, hint } = props
	const { getAllRoutes } = useApi()
	const [routes, setRoutes] = useState<Route[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [displayValue, setDisplayValue] = useState<string>('')
	const isDisabled = disabled || isLoading

	const handleChange = (newValue: string) => {
		onChange({
			target: { name, type: attribute.type, value: encodeURI(newValue) },
		})
	}

	const handleOptionCreate = (inputValue: any) => {
		const linkValue =
			typeof inputValue === 'string'
				? inputValue
				: inputValue?.target?.value || String(inputValue || '')

		if (linkValue) {
			handleChange(linkValue)
			setDisplayValue(encodeURI(linkValue))
		}
	}

	const getStartIcon = () => {
		if (!value) return null

		const matchedRoute = routes.find((route) => route.documentId === value)
		if (matchedRoute) {
			return <Link fill="neutral500" />
		}

		return <ExternalLink fill="neutral500" />
	}

	useEffect(() => {
		const fetchRoutes = async () => {
			setIsLoading(true)
			const fetchedRoutes = await getAllRoutes()
			setRoutes(fetchedRoutes)
			setIsLoading(false)

			if (value) {
				const matchedRoute = fetchedRoutes.find((route) => route.documentId === value)
				if (matchedRoute) {
					setDisplayValue(`${matchedRoute.title} (${matchedRoute.path})`)
				} else {
					setDisplayValue(value)
				}
			} else {
				setDisplayValue('')
			}
		}
		fetchRoutes()
	}, [value])

	return (
		<Field.Root id={name} required={required} hint={hint} disabled={isDisabled}>
			<Field.Label>{label}</Field.Label>
			<Combobox
				ref={ref}
				placeholder={placeholder}
				aria-label={label}
				aria-disabled={isDisabled}
				value={value || ''}
				textValue={displayValue || ''}
				creatable={true}
				onCreateOption={handleOptionCreate}
				createMessage={(inputValue: string) => `Use external link: ${encodeURI(inputValue)}`}
				creatableStartIcon={<ExternalLink fill="neutral500" />}
				startIcon={getStartIcon()}
				onChange={(routeId: string) => {
					if (!routeId) {
						setDisplayValue('')
						handleChange('')
						return
					}
					const selectedRoute = routes.find((r) => r.documentId === routeId)
					if (selectedRoute) {
						setDisplayValue(`${selectedRoute.title} (${selectedRoute.path})`)
						handleChange(routeId)
					}
				}}
				onInputChange={(inputValue: any) => {
					const textValue =
						typeof inputValue === 'string' ? inputValue : inputValue?.target?.value || ''
					setDisplayValue(textValue)
				}}
			>
				{routes.map((route) => (
					<ComboboxOption key={route.documentId} value={route.documentId}>
						{route.title} ({route.path})
					</ComboboxOption>
				))}
			</Combobox>
			<Box>
				<Field.Hint />
				<Field.Error />
			</Box>
		</Field.Root>
	)
})

export default Input
