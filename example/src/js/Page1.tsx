import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Page1(): JSX.Element {
	const navigate = useNavigate()

	return (
		<div>
			<h1>Page 1</h1>
			<p>Go to <Link to="/section/page2">Page2</Link></p>
			<p><button onClick={() => navigate(-1)}>Go Back</button></p>
		</div>
	)
}
