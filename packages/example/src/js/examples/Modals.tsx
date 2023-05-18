import { Route, Routes, useNavigate } from 'react-router-dom'
import ResetButton from '../ResetButton'
import { useState } from 'react'
import { NativeNavigationModal } from '@cactuslab/native-navigation-react'

export default function Modals() {
	return (
		<>
			<ResetButton />
			<Routes>
				<Route path="second" element={<Second />} />
				<Route path="*" element={<First />} />
			</Routes>
		</>
	)
}

function First() {
	const [showModal, setShowModal] = useState(false)
	const navigate = useNavigate()

	function handleShowModal(evt: React.MouseEvent) {
		evt.preventDefault()
		setShowModal(true)
	}

	function handleCancel(evt: React.MouseEvent) {
		evt.preventDefault()
		setShowModal(false)
	}

	function handleContinue(evt: React.MouseEvent) {
		evt.preventDefault()
		setShowModal(false)
		navigate('second')
	}

	return (
		<div>
			<h1>Modals</h1>
			<p>Shows a modal, and clicking a button in the modal closes the modal and navigates to the next screen.</p>

			{showModal && <p>Showing modal</p>}
			<button onClick={handleShowModal}>Show modal</button>
			<NativeNavigationModal open={showModal} component={{ type: 'view' }} presentationStyle='pageSheet' onClose={() => setShowModal(false)}>
				<h1>Modal</h1>
				<p>Cancel closes the modal. Continue will close the modal and move to the next screen.</p>
				<p>
					<button onClick={handleCancel}>Cancel</button>
					<button onClick={handleContinue}>Continue</button>
				</p>
			</NativeNavigationModal>
		</div>
	)
}

function Second() {
	return <p>This is the second screen.</p>
}
