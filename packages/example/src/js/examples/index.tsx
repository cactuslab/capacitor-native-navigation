import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Menu from './Menu'
import Subnav from './Subnav'

export default function Examples() {
	return (
		<Routes>
			<Route path="subnav/*" element={<Subnav />} />
			<Route path="menu" element={<Menu />} />
		</Routes>
	)
}
