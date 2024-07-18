import { Box, Typography, TextInput } from '@strapi/design-system';
import { useFetchClient } from '@strapi/helper-plugin';
import { useState, useRef, useCallback, useEffect} from 'react';
import transformToUrl from '../../../utils/transformToUrl';

interface Props {
	setPath: (path: string) => void; // Ensure this matches the expected type
	id: string;
	initialPath?: string;
	path?: string;
	label?: string;
	hint?: any;
	labelAction?: any;
	// onChange: any;
	disabled?: boolean;
	error?: boolean | string;
	onBlur?: any;
}

interface LoaderProps {
  isValid: boolean | null;
	replacement: string;
}

// Debounce function
function debounce(func: (newUrl: string) => void, wait: number) {
	let timeout: NodeJS.Timeout;
	return function executedFunction(...args: any) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}


// function Loader({isValid, replacement}: LoaderProps) {
// 	let color = 'neutral0'
// 	let text = 'Checking if URL is available...'

// 	if (isValid !== null) {
// 		color = isValid ? 'success500' : 'danger500'
// 		text = isValid ? 'URL is available' : `URL is not available. Replaced with "${replacement}".`
// 	}

// 	return (
// 		<Box paddingTop={2}>
// 			<Typography textColor={color}>{text}</Typography>
// 		</Box>
// 	)
// }

export default function URLInput({setPath, path, id, label, hint, labelAction, disabled, error, onBlur}: Props) {
	const { post } = useFetchClient();

	// const [isValid, setIsValid] = useState<boolean | null>(null);
	// const [replacement, setReplacement] = useState<string>('');
	const [inputValue, setInputValue] = useState(path);
	const [isValidating, setIsValidating] = useState(false);
	const [currentPath, setCurrentPath] = useState('')
	const fromApi = useRef(false); // Flag to track if the update is from the API

	// async function checkUrl(url: string) {
	// 	console.log("check url")
	// 	if (!url || url === replacement || url === initialPath) return

	// 	try {
	// 		const { data } = await post('/url-routes/checkUniquePath', { 
	// 			path: transformToUrl(url) 
	// 		});

	// 		setIsValid(data === url);
	// 		if (data !== url) {
	// 			setReplacement(data);
	// 			setUrl(data)
	// 			// setPath(data)
	// 		}
	// 	} catch (err) {
	// 		console.log(err)
	// 	}
	// }

	const validateUrl = async (url: string) => {
		console.log("validateUrl")
		if (isValidating) return;
		setIsValidating(true);
		
		if (!url) return;
		try {
			const { data } = await post('/url-routes/checkUniquePath', { 
				path: transformToUrl(url) 
			});

			if (data === path) return
			// console.log("URL chekced")
			// setCurrentPath(data)
			handleChange(data, 'api')
			// onNewPath(data)
			// fromApi.current = true
			// setPath(data)
			// setInputValue(data)
		} catch (error) {
			console.error('Error validating URL:', error);
		} finally {
			setIsValidating(false);
		}
	};

	const validateUrlDebounced = useCallback(debounce((url) => validateUrl(url), 500), []);

	function handleChange (url: string, from?: string) {
		if (from === 'input') {
			console.log("input")
			setInputValue(url)
			setPath(url)
		} else if (from === 'api') {
			console.log("api")
			setInputValue(url)
			setPath(url)
		} else {
			console.log(url)
			console.log(currentPath)
			if (url === currentPath) return
			setInputValue(url)
			validateUrlDebounced(url)
		} 
	}


	// useEffect(() => {
	// 	console.log(inputValue)
	// 	console.log(path)
	// 	console.log(fromApi.current)

	// 	if (isValidating) return;
		
  //   // Trigger API call on input change with debounce
	// 	if (inputValue && !fromApi.current) {
	// 		const debounceTimeout = setTimeout(() => {
	// 			validateUrl();
	// 			fromApi.current = false
	// 		}, 500);  // Adjust debounce time as needed

	// 		// Cleanup function to cancel the previous debounceTimeout if input changes
	// 		return () => clearTimeout(debounceTimeout);
	// 	}
  // }, [inputValue]);

  // const debouncedCheckUrl = debounce(checkUrl, 500);

	useEffect(() => {
		console.log("useEffect path: ", path)
		if (!path) return
		handleChange(path)
	}, [path]);

	// useEffect(() => {
	// 	console.log(url)
	// 	console.log(replacement)
	// 	console.log("---------------------------")
	// 	// if (!path) return
	// 	// setPath(transformToUrl(path))
	// 	if (!url || url === replacement || url === initialPath) return
	// 	debouncedCheckUrl(url);
  // }, [url]);















	// useEffect(() => {
	// 	// Trigger API call on input change with debounce
	// 	console.log(inputValue, isValidating);
	
	// 	if (inputValue && !isValidating) {
	// 		const debounceTimeout = setTimeout(() => {
	// 			validateUrl(inputValue);
	// 		}, 500); // Adjust debounce time as needed
	
	// 		// Cleanup function to cancel the previous debounceTimeout if input changes
	// 		return () => clearTimeout(debounceTimeout);
	// 	}
	// }, [inputValue, isValidating]);
	
	// useEffect(() => {
	// 	console.log(path, inputValue,);
	// 	if (path && inputValue !== path) {
	// 		console.log("drin");
	// 		setInputValue(path);
	// 	}
	// }, [path]);
	
	return (
		<Box>
			<TextInput
				id={id}
				label={label}
				hint={hint}
				labelAction={labelAction}
				value={inputValue}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(transformToUrl(e.target.value))}
				disabled={disabled}
				error={error}
				onBlur={onBlur}
			/>
			{/* {loading && <Loader isValid={isValid}/>} */}
			{/* <Loader isValid={isValid} replacement={replacement}/> */}
		</Box>

	)
}
