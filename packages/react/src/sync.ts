import type { ComponentId } from '@cactuslab/native-navigation';

let copyNodeId = 1

/**
 * Initialise syncing document.head node changes from `window` into the additional windows we create.
 * @param views the windows we've created; note that this collection is expected to change as new windows are created
 */
export function initSync(views: Record<ComponentId, Window>): void {
	/*
	 * Add a sentinel node to the window's head so we always have a previous sibling with an
	 * id for future additions so we can put them in the right place.
	 */
	const mainSentinel = window.document.createElement('META')
	mainSentinel.dataset['capacitorNativeNavigationId'] = 'sentinel'
	window.document.head.appendChild(mainSentinel)

	const observer = new MutationObserver(function(mutations) {
		for (const mutation of mutations) {
			/* Check for subtree changes */
			if (mutation.target !== window.document.head) {
				let node: Node | null = mutation.target
				while (node && node.parentNode !== window.document.head) {
					node = node.parentNode
				}

				if (node && shouldCopyNode(node)) {
					const nodeId = (node as HTMLElement).dataset['capacitorNativeNavigationId']
					if (nodeId) {
						for (const viewId of Object.keys(views)) {
							const view = views[viewId]
							const target = view.document.head.querySelector(`[data-capacitor-native-navigation-id="${nodeId}"]`)
							if (!target) {
								console.warn(`Update target "${nodeId}" not found in head for view: ${viewId}`)
								continue
							}

							target.replaceWith(node.cloneNode(true))
						}
					} else {
						console.warn(`Node to update did not have an id: ${node.nodeName}`)
					}
				}
				continue;
			}

			if (mutation.type !== 'childList') {
				return
			}

			if (mutation.addedNodes.length) {
				const add: HTMLElement[] = []

				/* Assign each added node an id */
				mutation.addedNodes.forEach(function(node) {
					if (shouldCopyNode(node)) {
						const element = node as HTMLElement
						element.dataset['capacitorNativeNavigationId'] = nextNodeId()
						add.push(element)
					}
				})

				if (add.length) {
					const prevSiblingId = findPreviousSiblingId(mutation.previousSibling)
					
					/* Copy added nodes to each view */
					for (const viewId of Object.keys(views)) {
						const view = views[viewId]
						const prevSibling = view.document.head.querySelector(`[data-capacitor-native-navigation-id="${prevSiblingId}"]`)
						if (!prevSibling) {
							console.warn(`Marker "${prevSiblingId}" not found in head for view: ${viewId}`)
							continue
						}

						let marker = prevSibling

						for (const node of add) {
							const clone = node.cloneNode(true) as Element
							marker.insertAdjacentElement('afterend', clone)
							marker = clone
						}
					}
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
					}
				})
			}
		}
	})
	
	try {
		observer.observe(window.document.head, {
			childList: true,
			subtree: true,
		})
	} catch (error) {
		console.warn('Failed to install document head synchronisation', error instanceof Error ? error.message : error)
	}
}

export function prepareWindowForSync(viewWindow: Window): void {
	/* Copy all of the relevant nodes to the new window, this will include the sentinel */
	window.document.head.childNodes.forEach(function(node) {
		if (shouldCopyNode(node)) {
			if (!(node as HTMLElement).dataset['capacitorNativeNavigationId']) {
				(node as HTMLElement).dataset['capacitorNativeNavigationId'] = nextNodeId();
			}
			viewWindow.document.head.append(node.cloneNode(true))
		}
	})
}

function nextNodeId(): string {
	return `${copyNodeId++}`
}

function shouldCopyNode(node: Node): boolean {
	if (node.nodeType !== Node.ELEMENT_NODE) {
		return false
	}

	const element = node as HTMLElement
	const name = node.nodeName.toUpperCase()
	if (name === 'STYLE') {
		return true
	}
	if (name === 'LINK') {
		if (element.getAttribute("rel") === 'stylesheet') {
			return true
		}
	}
	if (name === 'META' && element.dataset['capacitorNativeNavigationId'] === 'sentinel') {
		return true
	}
	return false
}

/**
 * Find the capacitorNativeNavigationId of the node to use as the previous sibling for nodes to insert.
 * @param node 
 */
function findPreviousSiblingId(node: Node | null): string {
	while (node) {
		if (node.nodeType === Node.ELEMENT_NODE) {
			const id = (node as HTMLElement).dataset['capacitorNativeNavigationId']
			if (id) {
				return id
			}
		}
		node = node.previousSibling
	}

	/* If we don't find a valid sibling, use the sentinel */
	return 'sentinel'
}
