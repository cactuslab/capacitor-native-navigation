import type { PluginListenerHandle } from '@capacitor/core'
import { NativeNavigation } from 'native-navigation'
import type { ClickEventData } from 'native-navigation'
import { useEffect } from 'react'
import type { NavigateOptions, Navigator, To } from 'react-router-dom'
import { Route, Router, Routes } from 'react-router-dom'

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
		const path = navigator.createHref(to)
		try {
			const { id } = await NativeNavigation.create({
				type: 'view',
				path,
				state,
			})
			await NativeNavigation.push({
				id,
			})
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

	useEffect(function() {
		NativeNavigation.setOptions({
			id: viewId,
			title: 'Hello World!',
			stack: {
				rightItems: [
					{
						id: 'r1',
						title: 'R1',
					}
				]
			}
		}).catch(function (reason) {
			console.log(`Failed to set options: ${reason}`)
		})

		let listener: PluginListenerHandle | undefined
		NativeNavigation.addListener(`click:${viewId}`, function(data: ClickEventData) {
			if (data.componentId !== viewId) {
				console.log('Ignoring click in ' + viewId)
				return
			}
			
			console.log('GOT CLICK ' + data)
		}).then(function(value) {
			listener = value
		})

		return function() {
			console.log('removing listener', listener)
			listener?.remove()
		}

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
				<Route path="root" element={<><h1>Root!!!</h1><p>Nice one!</p></>} />
			</Routes>
		</Router>
	)
}
