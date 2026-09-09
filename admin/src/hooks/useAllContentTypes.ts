import { useState, useEffect } from 'react'
import useApi from './useApi'
import { ContentType } from '../../../types'
import { isAbortError } from '../utils'

const useAllContentTypes = () => {
	const { fetchAllContentTypes } = useApi()
	const [contentTypes, setContentTypes] = useState<ContentType[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<unknown>(null)

	useEffect(() => {
		const fetchEntities = async () => {
			try {
				const result = await fetchAllContentTypes()

				setContentTypes(result)
				setLoading(false)
			} catch (err) {
				if (isAbortError(err)) return
				setError(err)
				setLoading(false)
			}
		}

		fetchEntities()
	}, [])
	return { contentTypes, loading, error }
}

export default useAllContentTypes
