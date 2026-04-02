import { NativeNavigation } from 'capacitor-native-navigation'
import { useNativeNavigationViewContext } from 'capacitor-native-navigation-react'
import { Await, createMemoryRouter, Link, useLoaderData, useNavigation, useNavigate } from 'react-router-dom'
import React, { Suspense, useEffect } from 'react'

/* Simulate an API call */
async function fakeDelay(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

type Post = { id: number; title: string; body: string }

const postsDb: Post[] = [
	{ id: 1, title: 'Getting Started with Native Navigation', body: 'This post covers the basics of setting up Capacitor Native Navigation in your React app. You\'ll learn how to present stacks, views, and tabs using native UI components.' },
	{ id: 2, title: 'Using Data Routers', body: 'Data routers let you define loaders and actions for your routes, loading data before the route renders. This works seamlessly with native navigation — each view gets its own independent router instance.' },
	{ id: 3, title: 'Tab Bar Configuration', body: 'Learn how to configure tab bars with badges, icons, and titles on both iOS and Android. iOS 26 uses the new Liquid Glass tab bar with the UITab API.' },
	{ id: 4, title: 'Building Cross-Platform Apps', body: 'Capacitor Native Navigation works on both iOS and Android, providing platform-native navigation components while sharing your React codebase.' },
	{ id: 5, title: 'Advanced Modal Presentations', body: 'Modals can be presented in various styles including pageSheet, formSheet, and fullScreen. They support cancellable gestures and custom bar configurations.' },
]

async function fetchPosts() {
	await fakeDelay(1500)
	return postsDb.map(({ id, title }) => ({ id, title }))
}

async function fetchPost(postId: string) {
	await fakeDelay(1000)
	const post = postsDb.find(p => p.id === Number(postId))
	if (!post) throw new Response('Not Found', { status: 404 })
	return post
}

/* Await mode: blocking loaders */
function postsLoaderAwait() {
	return fetchPosts()
}

function postLoaderAwait({ params }: { params: Record<string, string | undefined> }) {
	return fetchPost(params.postId || '')
}

/* Immediate mode: deferred loaders */
function postsLoaderImmediate() {
	return { posts: fetchPosts() }
}

function postLoaderImmediate({ params }: { params: Record<string, string | undefined> }) {
	return { post: fetchPost(params.postId || '') }
}

/* Await mode components */
function PostsListAwait() {
	const posts = useLoaderData() as { id: number; title: string }[]
	const navigation = useNavigation()
	const { updateView, addClickListener } = useNativeNavigationViewContext()

	useEffect(function() {
		updateView({
			title: 'Posts (await loaders)',
			stackItem: {
				rightItems: [{ id: 'reset', title: 'Reset' }],
			},
		})
		return addClickListener(function({ buttonId }) {
			if (buttonId === 'reset') NativeNavigation.reset()
		})
	}, [updateView, addClickListener])

	const isLoading = navigation.state === 'loading'

	return (
		<div>
			<h1>Posts</h1>
			<p>Loaders run before push. Current view stays visible with loading state.</p>
			{isLoading && <p style={{ color: '#0066cc' }}><em>Loading next page...</em></p>}
			<ul style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
				{posts.map(post => (
					<li key={post.id} style={{ padding: '8px 0' }}>
						<Link to={`/data-await/posts/${post.id}`}>{post.title}</Link>
					</li>
				))}
			</ul>
		</div>
	)
}

function PostDetailAwait() {
	const post = useLoaderData() as Post
	const { updateView } = useNativeNavigationViewContext()
	const navigate = useNavigate()

	useEffect(function() {
		updateView({ title: post.title })
	}, [updateView, post.title])

	return (
		<div>
			<h1>{post.title}</h1>
			<p style={{ lineHeight: 1.6 }}>{post.body}</p>
			<p style={{ color: '#888', fontSize: '0.9em' }}>Data was loaded before this view appeared.</p>
			<p><button onClick={() => navigate(-1)}>Go Back</button></p>
		</div>
	)
}

/* Immediate mode components */
function PostsListImmediate() {
	const { posts } = useLoaderData() as { posts: Promise<{ id: number; title: string }[]> }
	const { updateView, addClickListener } = useNativeNavigationViewContext()

	useEffect(function() {
		updateView({
			title: 'Posts (immediate push)',
			stackItem: {
				rightItems: [{ id: 'reset', title: 'Reset' }],
			},
		})
		return addClickListener(function({ buttonId }) {
			if (buttonId === 'reset') NativeNavigation.reset()
		})
	}, [updateView, addClickListener])

	return (
		<div>
			<h1>Posts</h1>
			<p>Push is immediate. Each view loads its own data with Suspense.</p>
			<Suspense fallback={<p><em>Loading posts...</em></p>}>
				<Await resolve={posts}>
					{(resolved: { id: number; title: string }[]) => (
						<ul>
							{resolved.map(post => (
								<li key={post.id} style={{ padding: '8px 0' }}>
									<Link to={`/data-immediate/posts/${post.id}`}>{post.title}</Link>
								</li>
							))}
						</ul>
					)}
				</Await>
			</Suspense>
		</div>
	)
}

function PostDetailImmediate() {
	const { post } = useLoaderData() as { post: Promise<Post> }
	const { updateView } = useNativeNavigationViewContext()
	const navigate = useNavigate()

	return (
		<div>
			<Suspense fallback={<p><em>Loading post...</em></p>}>
				<Await resolve={post}>
					{(resolved: Post) => {
						updateView({ title: resolved.title })
						return (
							<>
								<h1>{resolved.title}</h1>
								<p style={{ lineHeight: 1.6 }}>{resolved.body}</p>
								<p style={{ color: '#888', fontSize: '0.9em' }}>Data loaded after the view appeared.</p>
							</>
						)
					}}
				</Await>
			</Suspense>
			<p><button onClick={() => navigate(-1)}>Go Back</button></p>
		</div>
	)
}

/* Route definitions — prefixed to avoid collisions with the children-based router */
export const awaitRoutes = [
	{ path: '/data-await/posts', element: <PostsListAwait />, loader: postsLoaderAwait },
	{ path: '/data-await/posts/:postId', element: <PostDetailAwait />, loader: postLoaderAwait },
]

export const immediateRoutes = [
	{ path: '/data-immediate/posts', element: <PostsListImmediate />, loader: postsLoaderImmediate },
	{ path: '/data-immediate/posts/:postId', element: <PostDetailImmediate />, loader: postLoaderImmediate },
]

export const dataRouterAwait = createMemoryRouter(awaitRoutes, {
	initialEntries: ['/data-await/posts'],
})

export const dataRouterImmediate = createMemoryRouter(immediateRoutes, {
	initialEntries: ['/data-immediate/posts'],
})

export async function setupDataRouterAwait() {
	const result = await NativeNavigation.present({
		component: {
			alias: 'rootStack',
			type: 'stack',
			components: [{ type: 'view', path: '/data-await/posts', title: 'Posts' }],
		},
		animated: false,
	})
	console.log('INIT: data router (await) stack created', result.id)
}

export async function setupDataRouterImmediate() {
	const result = await NativeNavigation.present({
		component: {
			alias: 'rootStack',
			type: 'stack',
			components: [{ type: 'view', path: '/data-immediate/posts', title: 'Posts' }],
		},
		animated: false,
	})
	console.log('INIT: data router (immediate) stack created', result.id)
}
