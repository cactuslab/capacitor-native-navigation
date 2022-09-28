import { NativeNavigation } from 'native-navigation'
import React, { useEffect } from 'react'
import { Route, Router, Routes } from 'react-router-dom'
import type { Navigator, NavigateOptions, To } from 'react-router-dom'

import Page1 from './Page1'
import Page2 from './Page2'

interface Props {
	path: string
	viewId: string
}

const navigator: Navigator = {
	createHref: function (to: To): string {
		if (typeof to === 'string') {
			return to
		} else {
			let result = ''
			if (to.pathname) {
				result += to.pathname
			}
			if (to.search) {
				result += `?${to.search}`
			}
			if (to.hash) {
				result += `#${to.hash}`
			}
			return result
		}
	},
	go: async function (delta: number): Promise<void> {
		if (delta === -1) {
			await NativeNavigation.pop({})
		} else {
			throw new Error('Function not implemented.')
		}
	},
	push: async function (to: To, state?: any, opts?: NavigateOptions | undefined): Promise<void> {
		console.log('navigator push')
		const path = navigator.createHref(to)
		try {
			const { id } = await NativeNavigation.create({
				type: 'view',
				path,
				state,
			})
			console.log('navigator created view ' + id)
			await NativeNavigation.push({
				id,
			})
			console.log('navigator push complete')
		} catch (error) {
			console.log(`Failed to push ${error}`)
		}
	},
	replace: function (to: To, state?: any, opts?: NavigateOptions | undefined): void {
		throw new Error('Function not implemented.')
	}
}

export default function Root(props: Props): JSX.Element {
	const { path, viewId } = props
	console.log('rendering path', path)

	useEffect(function() {
		console.log('setting options')
		NativeNavigation.setOptions({
			id: viewId,
			title: 'Hello World!',
		}).catch(function (reason) {
			console.log('failed to set options ' + reason)
		})

		// let counter = 1
		// const t = setInterval(function() {
		// 	NativeNavigation.setOptions({
		// 		id: viewId,
		// 		title: 'Hello World ' + counter++,
		// 	}).catch(function (reason) {
		// 		console.log('failed to set options ' + reason)
		// 	})
		// }, 1000)
		// return function() {
		// 	clearInterval(t)
		// }
	}, [path])

	return (
		<Router location={path} navigator={navigator}>
			<Routes>
				<Route path="section">
					<Route path="page1" element={<Page1 />} />
					<Route path="page2" element={<Page2 />} />
				</Route>
			</Routes>
		</Router>
	)
}
