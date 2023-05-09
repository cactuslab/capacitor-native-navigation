import { NativeNavigation } from '@cactuslab/native-navigation'
import { initReact } from '@cactuslab/native-navigation-react'
import { NativeNavigationNavigatorOptions } from '@cactuslab/native-navigation-react-router'

export const nativeNavigationReact = initReact({
	plugin: NativeNavigation,
})

export const nativeNavigationNavigatorOptions: NativeNavigationNavigatorOptions = {
	modals: [
		{
			path: '/modal/',
			presentOptions(path, state) {
				return {
					component: {
						type: 'stack',
						bar: {
							background: {
								color: '#23ABED',
							},
							title: {
								color: '#223344',
								font: {
									name: 'Solway',
									size: 26,
								},
							},
							buttons: {
								color: '#334455',
								font: {
									name: 'Solway',
								},
							},
						},
						components: [
							{
								type: 'view',
								path,
								state,
								title: 'Test',
								stack: {
									rightItems: [
										{
											id: 'close-button',
											title: 'Close',
										},
									],
								},
							},
						],
					},
					style: 'formSheet',
					cancellable: true,
				}
			},
		},
	],
}
