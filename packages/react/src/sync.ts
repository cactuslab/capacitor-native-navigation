import type { ComponentId } from 'capacitor-native-navigation'
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
						for (const view of Object.values(views)) {
							const target = view.window.document.head.querySelector(`[data-capacitor-native-navigation-id="${nodeId}"]`)
							if (!target) {
								console.warn(`Update target "${nodeId}" not found in head for view: ${view.id}`)
								continue
							}

							target.replaceWith(copyOfHeadNode(node))
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
					for (const view of Object.values(views)) {
						const prevSibling = view.window.document.head.querySelector(`[data-capacitor-native-navigation-id="${prevSiblingId}"]`)
						if (!prevSibling) {
							console.warn(`Marker "${prevSiblingId}" not found in head for view: ${view.id}`)
							continue
						}

						let marker = prevSibling

						for (const node of add) {
							const clone = copyOfHeadNode(node) as Element
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
						for (const view of Object.values(views)) {
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
		for (let i = 0; i < window.document.styleSheets.length; i++) {
			const styleSheet = window.document.styleSheets[i]
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ((styleSheet as any).nativeNavigationMonitored) {
				continue
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(styleSheet as any).nativeNavigationMonitored = true
	
			/* Override insertRule so each time it is used we copy the new rule to the corresponding stylesheet in other windows */
			const originalInsertRule = styleSheet.insertRule
			styleSheet.insertRule = function(rule, index) {
				const nodeId = styleSheetNodeId(styleSheet)
				if (nodeId) {
					for (const view of Object.values(views)) {
						queueRuleCopy(view.window, nodeId, rule)
					}
				}

				return originalInsertRule.bind(styleSheet)(rule, index)
			}
		}
	}
}

/**
 * Make the copy of a node from our document head to put in one of our windows.
 * <p>
 * Emotion adds its rules with insertRule in production, so a `<style>` element it created
 * has no text of its own, and cloning it copies nothing. We put the rules that the element
 * holds into the copy as text instead.
 * <p>
 * We cannot copy them into the stylesheet of the new window here. The copy does not appear
 * in that window's `document.styleSheets` until after we return, so there is nothing to
 * copy them into yet.
 * @param node a node from our document head
 * @returns the node to put in the window
 */
function copyOfHeadNode(node: Node): Node {
	const clone = node.cloneNode(true)
	if (node.nodeName.toUpperCase() !== 'STYLE' || (clone as HTMLElement).textContent) {
		return clone
	}

	const styleSheet = findStyleSheetForNode(node)
	if (!styleSheet) {
		return clone
	}

	try {
		const rules: string[] = []
		for (let k = 0; k < styleSheet.cssRules.length; k++) {
			rules.push(styleSheet.cssRules[k].cssText)
		}
		(clone as HTMLElement).textContent = rules.join('\n')
	} catch (error) {
		console.warn(`Failed to read the rules of a <style> element to copy it: ${error instanceof Error ? error.message : error}`)
	}
	return clone
}

/**
 * Rules waiting to be added to a `<style>` element we copied into one of our windows.
 */
const pendingRuleCopies: { window: Window; nodeId: string; rule: string }[] = []
let flushingRuleCopies = false

/**
 * Add a rule to the copy of a stylesheet in one of our windows.
 * <p>
 * We add it to the text of the `<style>` element rather than to the stylesheet in that
 * window, because that stylesheet may not exist yet. A window's `document.styleSheets`
 * doesn't include an element we copied in until some time after we add it, and a rule we
 * failed to add would be lost for good. The element itself we can always find.
 * <p>
 * Adding text to a `<style>` element makes the window parse it again, so we batch the
 * rules and add each window's in one go.
 * @param viewWindow the window to add the rule to
 * @param nodeId the id of the `<style>` element that holds the rule in our document
 * @param rule the text of the rule
 */
function queueRuleCopy(viewWindow: Window, nodeId: string, rule: string) {
	pendingRuleCopies.push({ window: viewWindow, nodeId, rule })

	if (!flushingRuleCopies) {
		flushingRuleCopies = true
		queueMicrotask(flushRuleCopies)
	}
}

function flushRuleCopies() {
	flushingRuleCopies = false

	const batch = pendingRuleCopies.splice(0, pendingRuleCopies.length)
	const grouped = new Map<Window, Map<string, string[]>>()

	for (const item of batch) {
		let byNode = grouped.get(item.window)
		if (!byNode) {
			byNode = new Map()
			grouped.set(item.window, byNode)
		}

		const rules = byNode.get(item.nodeId)
		if (rules) {
			rules.push(item.rule)
		} else {
			byNode.set(item.nodeId, [item.rule])
		}
	}

	grouped.forEach(function(byNode, viewWindow) {
		byNode.forEach(function(rules, nodeId) {
			const element = viewWindow.document.head.querySelector(`[data-capacitor-native-navigation-id="${nodeId}"]`)
			if (!element) {
				console.warn(`Stylesheet "${nodeId}" not found in head to add ${rules.length} rule(s)`)
				return
			}

			element.append(rules.join('\n'))
		})
	})
}

/**
 * Find the id we gave the node that owns the given stylesheet, if it has one.
 * @param styleSheet a stylesheet
 * @returns 
 */
function styleSheetNodeId(styleSheet: CSSStyleSheet): string | undefined {
	/* A stylesheet has no owner node if it was constructed, or imported by another sheet */
	const ownerNode = styleSheet.ownerNode as HTMLElement | null
	return ownerNode?.dataset?.['capacitorNativeNavigationId']
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
			viewWindow.document.head.append(copyOfHeadNode(node))
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
