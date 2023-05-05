interface Path {
	pathname: string
	search?: string
	hash?: string
}

export function parsePath(path: string): Path {
	const result: Path = {
		pathname: path,
	}
	const s = path.indexOf('?')
	if (s !== -1) {
		result.pathname = path.substring(0, s)
		let search = path.substring(s)
		
		const h = search.indexOf('#')
		if (h !== -1) {
			result.hash = search.substring(h)
			search = search.substring(0, h)
		}
		result.search = search
	} else {
		const h = path.indexOf('#')
		if (h !== -1) {
			result.hash = path.substring(h)
			result.pathname = path.substring(0, h)
		}
	}
	return result
}
