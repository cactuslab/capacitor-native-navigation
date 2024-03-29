import { NativeNavigation } from '@cactuslab/native-navigation'
import { useNativeNavigationViewContext } from '@cactuslab/native-navigation-react'
import React, { useEffect } from 'react'
import menu from '../../assets/imgs/menu.png'

const menu64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAEsGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgdGlmZjpJbWFnZUxlbmd0aD0iNjAiCiAgIHRpZmY6SW1hZ2VXaWR0aD0iNjAiCiAgIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiCiAgIHRpZmY6WFJlc29sdXRpb249IjcyLzEiCiAgIHRpZmY6WVJlc29sdXRpb249IjcyLzEiCiAgIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSI2MCIKICAgZXhpZjpQaXhlbFlEaW1lbnNpb249IjYwIgogICBleGlmOkNvbG9yU3BhY2U9IjEiCiAgIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiCiAgIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIKICAgeG1wOk1vZGlmeURhdGU9IjIwMjItMTEtMTRUMTg6MzU6NDUrMTM6MDAiCiAgIHhtcDpNZXRhZGF0YURhdGU9IjIwMjItMTEtMTRUMTg6MzU6NDUrMTM6MDAiPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJwcm9kdWNlZCIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWZmaW5pdHkgUGhvdG8gMS4xMC41IgogICAgICBzdEV2dDp3aGVuPSIyMDIyLTExLTE0VDE4OjM1OjQ1KzEzOjAwIi8+CiAgICA8L3JkZjpTZXE+CiAgIDwveG1wTU06SGlzdG9yeT4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cjw/eHBhY2tldCBlbmQ9InIiPz50pk9pAAABgmlDQ1BzUkdCIElFQzYxOTY2LTIuMQAAKJF1kctLQkEUhz81McoyqEWLFlLWKqMMojZBSlgQIWbQa6M3H4Ha5V4lpG3QViiI2vRa1F9Q26B1EBRFEC2jdVGbktu5GhiRZzhzvvnNnMPMGbBG0kpGr+uHTDanhYN+99z8gtvxTCPN2OnCFVV0dSwUmqKmfdxhMeON16xV+9y/1rgc1xWw1AuPKqqWE54QnlrLqSZvC7cpqeiy8KlwryYXFL419ViFX0xOVvjLZC0SDoC1Rdid/MWxX6yktIywvBxPJp1Xfu5jvsQZz87OSOwU70AnTBA/biYZJ8AQA4zIPIQXH32yokZ+fzl/mlXJVWRWKaCxQpIUOXpFzUv1uMSE6HEZaQpm///2VU8M+irVnX6wPxnGWzc4tqBUNIzPQ8MoHYHtES6y1fzVAxh+F71Y1Tz74NqAs8uqFtuB801of1CjWrQs2cStiQS8nkDTPLReQ8NipWc/+xzfQ2RdvuoKdvegR867lr4BJ/xnybQGetoAAAAJcEhZcwAACxMAAAsTAQCanBgAAABqSURBVGiB7dc7CsJQFEXRjaMzzr9OQJyH9pIi4gN9uhac/n6qUwAAABxzqbbqPnm2ajmy8PULhh2V2/NypyMX+HVLtfb577ybtToPvg0AAC/RliaOtrRHWwIAYBBtaeJoS3u0JQAAgL/zAEnKx4wszbXUAAAAAElFTkSuQmCC'

export default function MenuLeftItems() {
	const { updateView, addClickListener } = useNativeNavigationViewContext()

	updateView({
		title: 'Left Items',
		stackItem: {
			leftItems: [
				{
					id: 'menu',
					title: 'Menu',
					android: {
						image: menu,
					},
				},
				{
					id: 'menu',
					title: 'Menu',
					image: menu64,
				},
			],
		},
		android: {
			backButtonId: 'andy-back',
		},
	})

	useEffect(function() {
		return addClickListener(function(id) {
			if (id.buttonId === 'andy-back') {
				console.log('Interrupted Back Button')
				// NativeNavigation.dismiss()
			} else {
				NativeNavigation.reset()
			}
		})
	}, [addClickListener])

	return (
		<div>
			<h1>Menu Left items</h1>
			<p>Two left buttons with hamburger menu items.</p>
		</div>
	)
}
