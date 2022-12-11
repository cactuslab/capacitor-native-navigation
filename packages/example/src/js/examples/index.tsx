import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Links from './Links'
import Menu from './Menu'
import Subnav from './Subnav'
import TallContent from './TallContent'

export default function Examples() {
	return (
		<Routes>
			<Route path="links" element={<Links />} />
			<Route path="menu" element={<Menu />} />
			<Route path="tall-content" element={<TallContent />} />
			<Route path="subnav/*" element={<Subnav />} />
		</Routes>
	)
}
