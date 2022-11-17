import type { ComponentId } from '@cactuslab/native-navigation';

/**
 * Initialise syncing document.head node changes from `window` into the additional windows we create.
 * @param views the windows we've created; note that this collection is expected to change as new windows are created
 */
export function initSync(views: Record<ComponentId, Window>): void {
	let copyNodeId = 1

	/*
	 * Add a sentinel node to the window's head so we always have a previous sibling with an
	 * id for future additions so we can put them in the right place.
	 */
	const mainSentinel = window.document.createElement('META')
	mainSentinel.dataset['capacitorNativeNavigationId'] = 'sentinel'
	window.document.head.appendChild(mainSentinel)

	const observer = new MutationObserver(function(mutations) {
		for (const mutation of mutations) {
			if (mutation.type !== 'childList') {
				return
			}

			if (mutation.addedNodes.length) {
				/* Assign each added node an id */
				mutation.addedNodes.forEach(function(node) {
					if (node.nodeType === Node.ELEMENT_NODE) {
						(node as HTMLElement).dataset['capacitorNativeNavigationId'] = `${copyNodeId++}`
					}
				})

				const prevSiblingId = mutation.previousSibling && mutation.previousSibling.nodeType === Node.ELEMENT_NODE ? (mutation.previousSibling as HTMLElement).dataset['capacitorNativeNavigationId'] : undefined
				if (prevSiblingId) {
					/* Copy added nodes to each view */
					for (const viewId of Object.keys(views)) {
						const view = views[viewId]
						const prevSibling = view.document.head.querySelector(`[data-capacitor-native-navigation-id="${prevSiblingId}"]`)
						if (!prevSibling) {
							console.warn(`Marker "${prevSiblingId}" not found in head for view: ${viewId}`)
							continue
						}

						let marker = prevSibling

						mutation.addedNodes.forEach(function(node) {
							if (node.nodeType === Node.ELEMENT_NODE) {
								const clone = node.cloneNode(true) as Element
								marker.insertAdjacentElement('afterend', clone)
								marker = clone
							}
						})
					}
				} else {
					console.warn('Nodes added to head in an unexpected location')
				}
			}

			if (mutation.removedNodes.length) {
				mutation.removedNodes.forEach(function(node) {
					const nodeId = (node as HTMLElement).dataset['capacitorNativeNavigationId']
					if (nodeId) {
						for (const viewId of Object.keys(views)) {
							const view = views[viewId]
							const nodeToRemove = view.document.head.querySelector(`[data-capacitor-native-navigation-id="${nodeId}"]`)
							if (nodeToRemove) {
								nodeToRemove.remove()
							}
						}
					} else {
						console.warn('Ignoring unknown node removed from head')
					}
				})
			}
		}
	})
	
	try {
		observer.observe(window.document.head, {
			childList: true,
		})
	} catch (error) {
		console.warn('Failed to install document head synchronisation', error instanceof Error ? error.message : error)
	}
}

export function prepareWindowForSync(viewWindow: Window): void {
	/* Copy all of the nodes with ids to the new window, this will include the sentinel */
	const nodes = window.document.head.querySelectorAll('[data-capacitor-native-navigation-id]')
	nodes.forEach(function(node) {
		viewWindow.document.head.append(node.cloneNode(true))
	})
}
