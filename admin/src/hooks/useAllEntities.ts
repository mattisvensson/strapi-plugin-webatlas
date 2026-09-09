import { useState, useEffect } from 'react'
import useApi from './useApi'
import { GroupedEntities } from '../../../types'
import { isAbortError } from '../utils'

const useAllEntities = () => {
	const { fetchAllEntities } = useApi()
	const [entities, setEntities] = useState<GroupedEntities[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<unknown>(null)

	useEffect(() => {
		const fetchEntities = async () => {
			try {
				const result = await fetchAllEntities()

				setEntities(result)
				setLoading(false)
			} catch (err) {
				if (isAbortError(err)) return
				setError(err)
				setLoading(false)
			}
		}

		fetchEntities()
	}, [])
	return { entities, loading, error }
}

export default useAllEntities
