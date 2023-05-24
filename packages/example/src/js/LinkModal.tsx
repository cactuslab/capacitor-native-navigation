import { Link, useNavigate } from 'react-router-dom'

export default function LinkModal() {
	return (
		<>
			<h1>Link Modal</h1>
			<p>This modal was linked to and appeared thanks to navigation rules.</p>
			<ul>
				<li><Link to="page2">Link to Page 2</Link></li>
				<li><Link to="/stack1">Link to Stack 1</Link></li>
				<li><Link to="/stack2">Link to Stack 2</Link></li>
			</ul>
		</>
	)
}

export function LinkModalPage2() {
	const navigate = useNavigate()
	
	return (
		<>
			<h1>Page 2</h1>
			<p>This should still be in the modal.</p>
			<p><button onClick={() => navigate(-1)}>Go Back</button></p>
		</>
	)
}