import React from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import ResetButton from '../ResetButton'

export default function Subnav() {
	const location = useLocation()
	return (
		<>
			{location.pathname}
			<ResetButton />
			<Routes>
				<Route path="first" element={<First />} />
				<Route path="second" element={<Second />} />
				<Route path="third" element={<Third />} />
			</Routes>
		</>
	)
}

function First() {
	return (
		<div>
			<Nav />
			<p>First</p>
		</div>
	)
}

function Second() {
	return (
		<div>
			<Nav />
			<p>Second</p>
		</div>
	)
}

function Third() {
	return (
		<div>
			<Nav />
			<p>Third</p>
		</div>
	)
}

function Nav() {
	return (
		<div>
			<Link to="../first" replace>First</Link> |
			<Link to="../second" replace>Second</Link> |
			<Link to="../third" replace>Third</Link>
		</div>
	)
}
