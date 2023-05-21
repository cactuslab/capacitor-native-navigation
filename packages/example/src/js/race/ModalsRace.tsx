import { NativeNavigationModal } from '@cactuslab/native-navigation-react'
import ResetButton from '../ResetButton'
import React, { useState } from 'react'

export default function ModalsRace() {
	const [opens, setOpens] = useState(createOpens(3, false))

	function handleOpen(index: number) {
		setOpens(opens => {
			const result = [...opens]
			result[index] = true
			return result
		})
	}

	function handleOpenAll() {
		setOpens(createOpens(opens.length, true))
	}

	function handleDismissBehind() {
		setTimeout(() => handleOpen(0), 10)
		setTimeout(() => handleOpen(1), 20)
		setTimeout(() => handleClose(0), 30)
	}

	function handleClose(index: number) {
		setOpens(opens => {
			const result = [...opens]
			result[index] = false
			return result
		})
	}

	return (
		<>
			<ResetButton />
			<h1>Modals Race</h1>
			<p>{opens.map((value, index) => (<React.Fragment key={index}>{index + 1} = {String(value)}<br /></React.Fragment>))}</p>
			<p>{opens.map((_, index) => (<React.Fragment key={index}><button onClick={() => handleOpen(index)}>Open {index + 1}</button> </React.Fragment>))}</p>
			<p>{opens.map((_, index) => (<React.Fragment key={index}><button onClick={() => handleClose(index)}>Close {index + 1}</button> </React.Fragment>))}</p>
			<p><button onClick={handleOpenAll}>Open All</button></p>
			<p><button onClick={handleDismissBehind}>Present then dismiss behind</button></p>
			
			{opens.map((value, index) => (
				<NativeNavigationModal open={value} onClose={() => handleClose(index)} component={{ type: 'view' }} presentationStyle='formSheet' key={index}>
					<h1>Modal {index + 1}</h1>
				</NativeNavigationModal>
			))}
		</>
	)
}

function createOpens(n: number, value: boolean): boolean[] {
	const result: boolean[] = []
	for (let i = 0; i < n; i++) {
		result.push(value)
	}
	return result
}
