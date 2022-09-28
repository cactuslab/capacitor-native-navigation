import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Page2(): JSX.Element {
	const navigate = useNavigate()

	return (
		<div>
			<h1>Page 2</h1>
			<p>Go to <Link to="/section/page1">Page1</Link></p>
			<p><button onClick={() => navigate(-1)}>Go Back</button></p>
		</div>
	)
}
