import type { Location, LocationDescriptor, LocationDescriptorObject } from 'history'

export function toLocationDescriptorObject(location: LocationDescriptor<unknown>, state: unknown): LocationDescriptorObject<unknown> {
	if (typeof location === 'object') {
		return { ...location }
	}

	let pathname = location

	const hashPos = pathname.indexOf('#')
	let hash: string
	if (hashPos !== -1) {
		hash = pathname.substring(hashPos)
		pathname = pathname.substring(0, hashPos)
	} else {
		hash = ''
	}

	const searchPos = pathname.indexOf('?')
	let search: string
	if (searchPos !== -1) {
		search = pathname.substring(searchPos)
		pathname = pathname.substring(0, searchPos)
	} else {
		search = ''
	}

	return {
		pathname,
		search,
		hash,
		state,
	}
}

export function toLocation(d: LocationDescriptorObject<unknown>): Location<unknown> {
	return {
		pathname: d.pathname || '',
		hash: d.hash || '',
		search: d.search || '',
		state: d.state,
	}
}

export function toAbsoluteLocationDescriptorObject(location: LocationDescriptorObject<unknown>, current: LocationDescriptorObject<unknown> | undefined): LocationDescriptorObject<unknown> {
	if (!current) {
		return location
	}

	if (location.pathname?.startsWith('/')) {
		return location
	}

	let base = current.pathname
	if (!base) {
		return location
	}

	if (!base.endsWith('/')) {
		const i = base.lastIndexOf('/')
		if (i === -1) {
			return location
		}
		base = base.substring(0, i + 1)
	}

	return {
		...location,
		pathname: `${base}${location.pathname || ''}`,
	}
}
