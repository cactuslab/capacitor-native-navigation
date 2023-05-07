import type { ComponentId } from '@cactuslab/native-navigation'
import { NativeNavigationReactView } from './types'

let copyNodeId = 1

/**
 * Initialise syncing document.head node changes from `window` into the additional windows we create.
 * @param views the windows we've created; note that this collection is expected to change as new windows are created
 */
export function initSync(views: Record<ComponentId, NativeNavigationReactView>): void {
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
							const target = view.window.document.head.querySelector(`[data-capacitor-native-navigation-id="${nodeId}"]`)
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
				continue
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
						const prevSibling = view.window.document.head.querySelector(`[data-capacitor-native-navigation-id="${prevSiblingId}"]`)
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
							const nodeToRemove = view.window.document.head.querySelector(`[data-capacitor-native-navigation-id="${nodeId}"]`)
							if (nodeToRemove) {
								nodeToRemove.remove()
							}
						}
					}
				})
			}
		}

		monitorStylesheets()
	})
	
	try {
		observer.observe(window.document.head, {
			childList: true,
			subtree: true,
		})
	} catch (error) {
		console.warn('Failed to install document head synchronisation', error instanceof Error ? error.message : error)
	}

	/**
	 * Monitor stylesheets on the main window so any rules added using insertRule are copied
	 * to other windows.
	 * <p>
	 * Emotion uses insertRule in production / speed mode rather than modifying the DOM.
	 */
	function monitorStylesheets() {
		// eslint-disable-next-line @typescript-eslint/prefer-for-of
		for (let i = 0; i < window.document.styleSheets.length; i++) {
			const styleSheet = window.document.styleSheets[i]
			if ((styleSheet as any).nativeNavigationMonitored) {
				continue
			}
			(styleSheet as any).nativeNavigationMonitored = true
	
			/* Override insertRule so each time it is used we copy the new rule to the corresponding stylesheet in other windows */
			const originalInsertRule = styleSheet.insertRule
			styleSheet.insertRule = function(rule, index) {
				const nodeId = (styleSheet.ownerNode as HTMLElement).dataset['capacitorNativeNavigationId']
				if (nodeId) {
					for (const viewId of Object.keys(views)) {
						const view = views[viewId]

						const targetStyleSheet = findMatchingStyleSheet(styleSheet, view.window)
						if (targetStyleSheet) {
							try {
								targetStyleSheet.insertRule(rule, index)
							} catch (error) {
								console.warn(`Failed to sync cssRule to ${viewId}: ${error instanceof Error ? error.message : error}: @${index} ${rule}`)
							}
						}
					}
				}

				return originalInsertRule.bind(styleSheet)(rule, index)
			}
	
			/* Copy the initial set of rules to other windows */
			for (const viewId of Object.keys(views)) {
				const view = views[viewId]

				copyInitialCssRules(styleSheet, view.window)
			}
		}
	}
}

/**
 * 
 * @param styleSheet the source stylesheet
 * @param view the native navigation window to find a matching stylesheet in to copy to
 */
function copyInitialCssRules(styleSheet: CSSStyleSheet, view: Window) {
	const targetStyleSheet = findMatchingStyleSheet(styleSheet, view)
	if (targetStyleSheet) {
		for (let k = 0; k < styleSheet.cssRules.length; k++) {
			const cssText = styleSheet.cssRules[k].cssText
			targetStyleSheet.insertRule(cssText, k)
		}
	}
}

/**
 * Find a style sheet in a native navigation window to match the given one in the main window.
 * @param source the source stylesheet in the main window
 * @param view the window to search in
 * @returns a style sheet or undefined if not found
 */
function findMatchingStyleSheet(source: CSSStyleSheet, view: Window): CSSStyleSheet | undefined {
	const nodeId = (source.ownerNode as HTMLElement).dataset['capacitorNativeNavigationId']
	if (!nodeId) {
		return undefined
	}

	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let j = 0; j < view.document.styleSheets.length; j++) {
		const targetStyleSheet = view.document.styleSheets[j]
		if ((targetStyleSheet.ownerNode as HTMLElement).dataset['capacitorNativeNavigationId'] === nodeId) {
			return targetStyleSheet
		}
	}

	return undefined
}

/**
 * Find the CSSStyleSheet corresponding to the given node, if any
 * @param node a DOM node
 * @returns 
 */
function findStyleSheetForNode(node: Node): CSSStyleSheet | undefined {
	const doc = node.ownerDocument
	if (!doc) {
		return undefined
	}

	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let i = 0; i < doc.styleSheets.length; i++) {
		const styleSheet = doc.styleSheets[i]
		if (styleSheet.ownerNode === node) {
			return styleSheet
		}
	}
	return undefined
}

export function prepareWindowForSync(viewWindow: Window): void {
	/* Copy all of the relevant nodes to the new window, this will include the sentinel */
	window.document.head.childNodes.forEach(function(node) {
		if (shouldCopyNode(node)) {
			if (!(node as HTMLElement).dataset['capacitorNativeNavigationId']) {
				(node as HTMLElement).dataset['capacitorNativeNavigationId'] = nextNodeId()
			}
			viewWindow.document.head.append(node.cloneNode(true))

			/* Sync CSS rules */
			const styleSheet = findStyleSheetForNode(node)
			if (styleSheet) {
				copyInitialCssRules(styleSheet, viewWindow)
			}
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
		if (element.getAttribute('rel') === 'stylesheet') {
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
