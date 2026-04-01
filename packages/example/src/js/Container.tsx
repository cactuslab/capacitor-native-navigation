import React from 'react'
import { Outlet } from 'react-router-dom'

export default function Container(): React.ReactElement {
	return (
		<Outlet />
	)
}
