export type BodyResponseCallback<T> = (
	err: Error | null,
	res?: Response<T> | null
) => void;

interface StandardParameters {
	resource?: Schema$Post | Schema$Page;
	/**
	 * Auth client or API Key for the request
	 */
	auth?: string;
	/**
	 * V1 error format.
	 */
	"$.xgafv"?: string;
	/**
	 * OAuth access token.
	 */
	access_token?: string;
	/**
	 * Data format for response.
	 */
	alt?: string;
	/**
	 * JSONP
	 */
	callback?: string;
	/**
	 * Selector specifying which fields to include in a partial response.
	 */
	fields?: string;
	/**
	 * API key. Your API key identifies your project and provides you with API access, quota, and reports. Required unless you provide an OAuth 2.0 token.
	 */
	key?: string;
	/**
	 * OAuth 2.0 token for the current user.
	 */
	oauth_token?: string;
	/**
	 * Returns response with indentations and line breaks.
	 */
	prettyPrint?: boolean;
	/**
	 * Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.
	 */
	quotaUser?: string;
	/**
	 * Legacy upload protocol for media (e.g. "media", "multipart").
	 */
	uploadType?: string;
	/**
	 * Upload protocol for media (e.g. "raw", "multipart").
	 */
	upload_protocol?: string;
}

export interface Blogger {
	// context: APIRequestContext;
	blogs: Resource$Blogs;
	// blogUserInfos: Resource$Bloguserinfos;
	// comments: Resource$Comments;
	// pages: Resource$Pages;
	// pageViews: Resource$Pageviews;
	posts: Resource$Posts;
	// postUserInfos: Resource$Postuserinfos;
	// users: Resource$Users;
}

export interface Schema$Blog {
	/**
	 * The JSON custom meta-data for the Blog.
	 */
	customMetaData?: string | null;
	/**
	 * The description of this blog. This is displayed underneath the title.
	 */
	description?: string | null;
	/**
	 * The identifier for this resource.
	 */
	id?: string | null;
	/**
	 * The kind of this entry. Always blogger#blog.
	 */
	kind?: string | null;
	/**
	 * The locale this Blog is set to.
	 */
	locale?: {
		country?: string;
		language?: string;
		variant?: string;
	} | null;
	/**
	 * The name of this blog. This is displayed as the title.
	 */
	name?: string | null;
	/**
	 * The container of pages in this blog.
	 */
	pages?: {
		selfLink?: string;
		totalItems?: number;
	} | null;
	/**
	 * The container of posts in this blog.
	 */
	posts?: {
		items?: Schema$Post[];
		selfLink?: string;
		totalItems?: number;
	} | null;
	/**
	 * RFC 3339 date-time when this blog was published.
	 */
	published?: string | null;
	/**
	 * The API REST URL to fetch this resource from.
	 */
	selfLink?: string | null;
	/**
	 * The status of the blog.
	 */
	status?: string | null;
	/**
	 * RFC 3339 date-time when this blog was last updated.
	 */
	updated?: string | null;
	/**
	 * The URL where this blog is published.
	 */
	url?: string | null;
}
export interface Schema$BlogList {
	/**
	 * Admin level list of blog per-user information.
	 */
	blogUserInfos?: Schema$BlogUserInfo[];
	/**
	 * The list of Blogs this user has Authorship or Admin rights over.
	 */
	items?: Schema$Blog[];
	/**
	 * The kind of this entity. Always blogger#blogList.
	 */
	kind?: string | null;
}
export interface Schema$BlogPerUserInfo {
	/**
	 * ID of the Blog resource.
	 */
	blogId?: string | null;
	/**
	 * True if the user has Admin level access to the blog.
	 */
	hasAdminAccess?: boolean | null;
	/**
	 * The kind of this entity. Always blogger#blogPerUserInfo.
	 */
	kind?: string | null;
	/**
	 * The Photo Album Key for the user when adding photos to the blog.
	 */
	photosAlbumKey?: string | null;
	/**
	 * Access permissions that the user has for the blog (ADMIN, AUTHOR, or READER).
	 */
	role?: string | null;
	/**
	 * ID of the User.
	 */
	userId?: string | null;
}
export interface Schema$BlogUserInfo {
	/**
	 * The Blog resource.
	 */
	blog?: Schema$Blog;
	/**
	 * Information about a User for the Blog.
	 */
	blog_user_info?: Schema$BlogPerUserInfo;
	/**
	 * The kind of this entity. Always blogger#blogUserInfo.
	 */
	kind?: string | null;
}
export interface Schema$Comment {
	/**
	 * The author of this Comment.
	 */
	author?: {
		displayName?: string;
		id?: string;
		image?: {
			url?: string;
		};
		url?: string;
	} | null;
	/**
	 * Data about the blog containing this comment.
	 */
	blog?: {
		id?: string;
	} | null;
	/**
	 * The actual content of the comment. May include HTML markup.
	 */
	content?: string | null;
	/**
	 * The identifier for this resource.
	 */
	id?: string | null;
	/**
	 * Data about the comment this is in reply to.
	 */
	inReplyTo?: {
		id?: string;
	} | null;
	/**
	 * The kind of this entry. Always blogger#comment.
	 */
	kind?: string | null;
	/**
	 * Data about the post containing this comment.
	 */
	post?: {
		id?: string;
	} | null;
	/**
	 * RFC 3339 date-time when this comment was published.
	 */
	published?: string | null;
	/**
	 * The API REST URL to fetch this resource from.
	 */
	selfLink?: string | null;
	/**
	 * The status of the comment (only populated for admin users).
	 */
	status?: string | null;
	/**
	 * RFC 3339 date-time when this comment was last updated.
	 */
	updated?: string | null;
}
export interface Schema$CommentList {
	/**
	 * Etag of the response.
	 */
	etag?: string | null;
	/**
	 * The List of Comments for a Post.
	 */
	items?: Schema$Comment[];
	/**
	 * The kind of this entry. Always blogger#commentList.
	 */
	kind?: string | null;
	/**
	 * Pagination token to fetch the next page, if one exists.
	 */
	nextPageToken?: string | null;
	/**
	 * Pagination token to fetch the previous page, if one exists.
	 */
	prevPageToken?: string | null;
}
export interface Schema$Page {
	/**
	 * The author of this Page.
	 */
	author?: {
		displayName?: string;
		id?: string;
		image?: {
			url?: string;
		};
		url?: string;
	} | null;
	/**
	 * Data about the blog containing this Page.
	 */
	blog?: {
		id?: string;
	} | null;
	/**
	 * The body content of this Page, in HTML.
	 */
	content?: string | null;
	/**
	 * Etag of the resource.
	 */
	etag?: string | null;
	/**
	 * The identifier for this resource.
	 */
	id?: string | null;
	/**
	 * The kind of this entity. Always blogger#page.
	 */
	kind?: string | null;
	/**
	 * RFC 3339 date-time when this Page was published.
	 */
	published?: string | null;
	/**
	 * The API REST URL to fetch this resource from.
	 */
	selfLink?: string | null;
	/**
	 * The status of the page for admin resources (either LIVE or DRAFT).
	 */
	status?: string | null;
	/**
	 * The title of this entity. This is the name displayed in the Admin user interface.
	 */
	title?: string | null;
	/**
	 * RFC 3339 date-time when this Page was trashed.
	 */
	trashed?: string | null;
	/**
	 * RFC 3339 date-time when this Page was last updated.
	 */
	updated?: string | null;
	/**
	 * The URL that this Page is displayed at.
	 */
	url?: string | null;
}
export interface Schema$PageList {
	/**
	 * Etag of the response.
	 */
	etag?: string | null;
	/**
	 * The list of Pages for a Blog.
	 */
	items?: Schema$Page[];
	/**
	 * The kind of this entity. Always blogger#pageList.
	 */
	kind?: string | null;
	/**
	 * Pagination token to fetch the next page, if one exists.
	 */
	nextPageToken?: string | null;
}
export interface Schema$Pageviews {
	/**
	 * Blog Id.
	 */
	blogId?: string | null;
	/**
	 * The container of posts in this blog.
	 */
	counts?: Array<{
		count?: string;
		timeRange?: string;
	}> | null;
	/**
	 * The kind of this entry. Always blogger#page_views.
	 */
	kind?: string | null;
}
export interface Schema$Post {
	/**
	 * The author of this Post.
	 */
	author?: {
		displayName?: string;
		id?: string;
		image?: {
			url?: string;
		};
		url?: string;
	} | null;
	/**
	 * Data about the blog containing this Post.
	 */
	blog?: {
		id?: string;
	} | null;
	/**
	 * The content of the Post. May contain HTML markup.
	 */
	content?: string | null;
	/**
	 * The JSON meta-data for the Post.
	 */
	customMetaData?: string | null;
	/**
	 * Etag of the resource.
	 */
	etag?: string | null;
	/**
	 * The identifier of this Post.
	 */
	id?: string | null;
	/**
	 * Display image for the Post.
	 */
	images?: Array<{
		url?: string;
	}> | null;
	/**
	 * The kind of this entity. Always blogger#post.
	 */
	kind?: string | null;
	/**
	 * The list of labels this Post was tagged with.
	 */
	labels?: string[] | null;
	/**
	 * The location for geotagged posts.
	 */
	location?: {
		lat?: number;
		lng?: number;
		name?: string;
		span?: string;
	} | null;
	/**
	 * RFC 3339 date-time when this Post was published.
	 */
	published?: string | null;
	/**
	 * Comment control and display setting for readers of this post.
	 */
	readerComments?: string | null;
	/**
	 * The container of comments on this Post.
	 */
	replies?: {
		items?: Schema$Comment[];
		selfLink?: string;
		totalItems?: string;
	} | null;
	/**
	 * The API REST URL to fetch this resource from.
	 */
	selfLink?: string | null;
	/**
	 * Status of the post. Only set for admin-level requests.
	 */
	status?: string | null;
	/**
	 * The title of the Post.
	 */
	title?: string | null;
	/**
	 * The title link URL, similar to atom's related link.
	 */
	titleLink?: string | null;
	/**
	 * RFC 3339 date-time when this Post was last trashed.
	 */
	trashed?: string | null;
	/**
	 * RFC 3339 date-time when this Post was last updated.
	 */
	updated?: string | null;
	/**
	 * The URL where this Post is displayed.
	 */
	url?: string | null;
}
export interface Schema$PostList {
	/**
	 * Etag of the response.
	 */
	etag?: string | null;
	/**
	 * The list of Posts for this Blog.
	 */
	items?: Schema$Post[];
	/**
	 * The kind of this entity. Always blogger#postList.
	 */
	kind?: string | null;
	/**
	 * Pagination token to fetch the next page, if one exists.
	 */
	nextPageToken?: string | null;
	/**
	 * Pagination token to fetch the previous page, if one exists.
	 */
	prevPageToken?: string | null;
}
export interface Schema$PostPerUserInfo {
	/**
	 * ID of the Blog that the post resource belongs to.
	 */
	blogId?: string | null;
	/**
	 * True if the user has Author level access to the post.
	 */
	hasEditAccess?: boolean | null;
	/**
	 * The kind of this entity. Always blogger#postPerUserInfo.
	 */
	kind?: string | null;
	/**
	 * ID of the Post resource.
	 */
	postId?: string | null;
	/**
	 * ID of the User.
	 */
	userId?: string | null;
}
export interface Schema$PostUserInfo {
	/**
	 * The kind of this entity. Always blogger#postUserInfo.
	 */
	kind?: string | null;
	/**
	 * The Post resource.
	 */
	post?: Schema$Post;
	/**
	 * Information about a User for the Post.
	 */
	post_user_info?: Schema$PostPerUserInfo;
}
export interface Schema$PostUserInfosList {
	/**
	 * The list of Posts with User information for the post, for this Blog.
	 */
	items?: Schema$PostUserInfo[];
	/**
	 * The kind of this entity. Always blogger#postList.
	 */
	kind?: string | null;
	/**
	 * Pagination token to fetch the next page, if one exists.
	 */
	nextPageToken?: string | null;
}
export interface Schema$User {
	/**
	 * Profile summary information.
	 */
	about?: string | null;
	/**
	 * The container of blogs for this user.
	 */
	blogs?: {
		selfLink?: string;
	} | null;
	/**
	 * The timestamp of when this profile was created, in seconds since epoch.
	 */
	created?: string | null;
	/**
	 * The display name.
	 */
	displayName?: string | null;
	/**
	 * The identifier for this User.
	 */
	id?: string | null;
	/**
	 * The kind of this entity. Always blogger#user.
	 */
	kind?: string | null;
	/**
	 * This user's locale
	 */
	locale?: {
		country?: string;
		language?: string;
		variant?: string;
	} | null;
	/**
	 * The API REST URL to fetch this resource from.
	 */
	selfLink?: string | null;
	/**
	 * The user's profile page.
	 */
	url?: string | null;
}

/* Resource Blogs */
export interface Resource$Blogs {
	// context: APIRequestContext;
	get(
		params?: Params$Resource$Blogs$Get,
		options?: any | BodyResponseCallback<ReadableStream>,
		callback?: BodyResponseCallback<ReadableStream>
	): void;

	getByUrl(
		params: Params$Resource$Blogs$Getbyurl,
		options: any
	): Promise<ReadableStream>;
	getByUrl(
		params?: Params$Resource$Blogs$Getbyurl,
		options?: any
	): Promise<Schema$Blog>;
	getByUrl(
		params: Params$Resource$Blogs$Getbyurl,
		options: any | BodyResponseCallback<ReadableStream>,
		callback: BodyResponseCallback<ReadableStream>
	): void;
	getByUrl(
		params: Params$Resource$Blogs$Getbyurl,
		options: any | BodyResponseCallback<Schema$Blog>,
		callback: BodyResponseCallback<Schema$Blog>
	): void;
	getByUrl(
		params: Params$Resource$Blogs$Getbyurl,
		callback: BodyResponseCallback<Schema$Blog>
	): void;
	getByUrl(callback: BodyResponseCallback<Schema$Blog>): void;
	/**
	 * Lists blogs by user.
	 * @example
	 * ```js
	 * // Before running the sample:
	 * // - Enable the API at:
	 * //   https://console.developers.google.com/apis/api/blogger.googleapis.com
	 * // - Login into gcloud by running:
	 * //   `$ gcloud auth application-default login`
	 * // - Install the npm module by running:
	 * //   `$ npm install googleapis`
	 *
	 * const {google} = require('googleapis');
	 * const blogger = google.blogger('v3');
	 *
	 * async function main() {
	 *   const auth = new google.auth.GoogleAuth({
	 *     // Scopes can be specified either as an array or as a single, space-delimited string.
	 *     scopes: [
	 *       'https://www.googleapis.com/auth/blogger',
	 *       'https://www.googleapis.com/auth/blogger.readonly',
	 *     ],
	 *   });
	 *
	 *   // Acquire an auth client, and bind it to all future calls
	 *   const authClient = await auth.getClient();
	 *   google.options({auth: authClient});
	 *
	 *   // Do the magic
	 *   const res = await blogger.blogs.listByUser({
	 *     fetchUserInfo: 'placeholder-value',
	 *
	 *     role: 'placeholder-value',
	 *     // Default value of status is LIVE.
	 *     status: 'placeholder-value',
	 *
	 *     userId: 'placeholder-value',
	 *
	 *     view: 'placeholder-value',
	 *   });
	 *   console.log(res.data);
	 *
	 *   // Example response
	 *   // {
	 *   //   "blogUserInfos": [],
	 *   //   "items": [],
	 *   //   "kind": "my_kind"
	 *   // }
	 * }
	 *
	 * main().catch(e => {
	 *   console.error(e);
	 *   throw e;
	 * });
	 *
	 * ```
	 *
	 * @param params - Parameters for request
	 * @param options - Optionally override request options, such as `url`, `method`, and `encoding`.
	 * @param callback - Optional callback that handles the response.
	 * @returns A promise if used with async/await, or void if used with a callback.
	 */
	listByUser(
		params: Params$Resource$Blogs$Listbyuser,
		options: any
	): Promise<ReadableStream>;
	listByUser(
		params?: Params$Resource$Blogs$Listbyuser,
		options?: any
	): Promise<Schema$BlogList>;
	listByUser(
		params: Params$Resource$Blogs$Listbyuser,
		options: any | BodyResponseCallback<ReadableStream>,
		callback: BodyResponseCallback<ReadableStream>
	): void;
	listByUser(
		params: Params$Resource$Blogs$Listbyuser,
		options: any | BodyResponseCallback<Schema$BlogList>,
		callback: BodyResponseCallback<Schema$BlogList>
	): void;
	listByUser(
		params: Params$Resource$Blogs$Listbyuser,
		callback: BodyResponseCallback<Schema$BlogList>
	): void;
	listByUser(callback: BodyResponseCallback<Schema$BlogList>): void;
}

export interface Params$Resource$Blogs$Get extends StandardParameters {
	/**
	 *
	 */
	blogId?: string;
	/**
	 *
	 */
	maxPosts?: number;
	/**
	 *
	 */
	view?: string;
}
export interface Params$Resource$Blogs$Getbyurl extends StandardParameters {
	/**
	 *
	 */
	url?: string;
	/**
	 *
	 */
	view?: string;
}
export interface Params$Resource$Blogs$Listbyuser extends StandardParameters {
	/**
	 *
	 */
	fetchUserInfo?: boolean;
	/**
	 *
	 */
	role?: string[];
	/**
	 * Default value of status is LIVE.
	 */
	status?: string[];
	/**
	 *
	 */
	userId?: string;
	/**
	 *
	 */
	view?: string;
}

/* Resource Blog User Info */
// export interface Resource$Bloguserinfos {
//   // context: APIRequestContext;
//   get(params: Params$Resource$Bloguserinfos$Get, options: nay): Promise<ReadableStream>;
//   get(params?: Params$Resource$Bloguserinfos$Get, options?: nay): Promise<Schema$BlogUserInfo>;
//   get(
//     params: Params$Resource$Bloguserinfos$Get,
//     options: any | BodyResponseCallback<ReadableStream>,
//     callback: BodyResponseCallback<ReadableStream>
//   ): void;
//   get(
//     params: Params$Resource$Bloguserinfos$Get,
//     options: any | BodyResponseCallback<Schema$BlogUserInfo>,
//     callback: BodyResponseCallback<Schema$BlogUserInfo>
//   ): void;
//   get(
//     params: Params$Resource$Bloguserinfos$Get,
//     callback: BodyResponseCallback<Schema$BlogUserInfo>
//   ): void;
//   get(callback: BodyResponseCallback<Schema$BlogUserInfo>): void;
// }

/* Resource Posts */
export interface Resource$Posts {
	// context: APIRequestContext;
	delete(
		params: Params$Resource$Posts$Delete,
		options: any
	): Promise<ReadableStream>;
	delete(params?: Params$Resource$Posts$Delete, options?: any): Promise<void>;
	delete(
		params: Params$Resource$Posts$Delete,
		options: any | BodyResponseCallback<ReadableStream>,
		callback: BodyResponseCallback<ReadableStream>
	): void;
	delete(
		params: Params$Resource$Posts$Delete,
		options: any | BodyResponseCallback<void>,
		callback: BodyResponseCallback<void>
	): void;
	delete(
		params: Params$Resource$Posts$Delete,
		callback: BodyResponseCallback<void>
	): void;
	delete(callback: BodyResponseCallback<void>): void;
	get(params: Params$Resource$Posts$Get, options: any): Promise<ReadableStream>;
	get(params?: Params$Resource$Posts$Get, options?: any): Promise<Schema$Post>;
	get(
		params: Params$Resource$Posts$Get,
		options: any | BodyResponseCallback<ReadableStream>,
		callback: BodyResponseCallback<ReadableStream>
	): void;
	get(
		params: Params$Resource$Posts$Get,
		options: any | BodyResponseCallback<Schema$Post>,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	get(
		params: Params$Resource$Posts$Get,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	get(callback: BodyResponseCallback<Schema$Post>): void;
	getByPath(
		params: Params$Resource$Posts$Getbypath,
		options: any
	): Promise<ReadableStream>;
	getByPath(
		params?: Params$Resource$Posts$Getbypath,
		options?: any
	): Promise<Schema$Post>;
	getByPath(
		params: Params$Resource$Posts$Getbypath,
		options: any | BodyResponseCallback<ReadableStream>,
		callback: BodyResponseCallback<ReadableStream>
	): void;
	getByPath(
		params: Params$Resource$Posts$Getbypath,
		options: any | BodyResponseCallback<Schema$Post>,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	getByPath(
		params: Params$Resource$Posts$Getbypath,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	getByPath(callback: BodyResponseCallback<Schema$Post>): void;
	insert(
		params: Params$Resource$Posts$Insert,
		options: any
	): Promise<ReadableStream>;
	insert(
		params?: Params$Resource$Posts$Insert,
		options?: any
	): Promise<Schema$Post>;
	insert(
		params: Params$Resource$Posts$Insert,
		options: any | BodyResponseCallback<ReadableStream>,
		callback: BodyResponseCallback<ReadableStream>
	): void;
	insert(
		params: Params$Resource$Posts$Insert,
		options: any | BodyResponseCallback<Schema$Post>,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	insert(
		params: Params$Resource$Posts$Insert,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	insert(callback: BodyResponseCallback<Schema$Post>): void;
	list(
		params: Params$Resource$Posts$List,
		options: any
	): Promise<ReadableStream>;
	list(
		params?: Params$Resource$Posts$List,
		options?: any
	): Promise<Schema$PostList>;
	list(
		params: Params$Resource$Posts$List,
		options: any | BodyResponseCallback<ReadableStream>,
		callback: BodyResponseCallback<ReadableStream>
	): void;
	list(
		params: Params$Resource$Posts$List,
		options: any | BodyResponseCallback<Schema$PostList>,
		callback: BodyResponseCallback<Schema$PostList>
	): void;
	list(
		params: Params$Resource$Posts$List,
		callback: BodyResponseCallback<Schema$PostList>
	): void;
	list(callback: BodyResponseCallback<Schema$PostList>): void;
	patch(
		params: Params$Resource$Posts$Patch,
		options: any
	): Promise<ReadableStream>;
	patch(
		params?: Params$Resource$Posts$Patch,
		options?: any
	): Promise<Schema$Post>;
	patch(
		params: Params$Resource$Posts$Patch,
		options: any | BodyResponseCallback<ReadableStream>,
		callback: BodyResponseCallback<ReadableStream>
	): void;
	patch(
		params: Params$Resource$Posts$Patch,
		options: any | BodyResponseCallback<Schema$Post>,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	patch(
		params: Params$Resource$Posts$Patch,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	patch(callback: BodyResponseCallback<Schema$Post>): void;
	publish(
		params: Params$Resource$Posts$Publish,
		options: any
	): Promise<ReadableStream>;
	publish(
		params?: Params$Resource$Posts$Publish,
		options?: any
	): Promise<Schema$Post>;
	publish(
		params: Params$Resource$Posts$Publish,
		options: any | BodyResponseCallback<ReadableStream>,
		callback: BodyResponseCallback<ReadableStream>
	): void;
	publish(
		params: Params$Resource$Posts$Publish,
		options: any | BodyResponseCallback<Schema$Post>,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	publish(
		params: Params$Resource$Posts$Publish,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	publish(callback: BodyResponseCallback<Schema$Post>): void;
	revert(
		params: Params$Resource$Posts$Revert,
		options: any
	): Promise<ReadableStream>;
	revert(
		params?: Params$Resource$Posts$Revert,
		options?: any
	): Promise<Schema$Post>;
	revert(
		params: Params$Resource$Posts$Revert,
		options: any | BodyResponseCallback<ReadableStream>,
		callback: BodyResponseCallback<ReadableStream>
	): void;
	revert(
		params: Params$Resource$Posts$Revert,
		options: any | BodyResponseCallback<Schema$Post>,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	revert(
		params: Params$Resource$Posts$Revert,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	revert(callback: BodyResponseCallback<Schema$Post>): void;
	search(
		params: Params$Resource$Posts$Search,
		options: any
	): Promise<ReadableStream>;
	search(
		params?: Params$Resource$Posts$Search,
		options?: any
	): Promise<Schema$PostList>;
	search(
		params: Params$Resource$Posts$Search,
		options: any | BodyResponseCallback<ReadableStream>,
		callback: BodyResponseCallback<ReadableStream>
	): void;
	search(
		params: Params$Resource$Posts$Search,
		options: any | BodyResponseCallback<Schema$PostList>,
		callback: BodyResponseCallback<Schema$PostList>
	): void;
	search(
		params: Params$Resource$Posts$Search,
		callback: BodyResponseCallback<Schema$PostList>
	): void;
	search(callback: BodyResponseCallback<Schema$PostList>): void;
	update(
		params: Params$Resource$Posts$Update,
		options: any
	): Promise<ReadableStream>;
	update(
		params?: Params$Resource$Posts$Update,
		options?: any
	): Promise<Schema$Post>;
	update(
		params: Params$Resource$Posts$Update,
		options: any | BodyResponseCallback<ReadableStream>,
		callback: BodyResponseCallback<ReadableStream>
	): void;
	update(
		params: Params$Resource$Posts$Update,
		options: any | BodyResponseCallback<Schema$Post>,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	update(
		params: Params$Resource$Posts$Update,
		callback: BodyResponseCallback<Schema$Post>
	): void;
	update(callback: BodyResponseCallback<Schema$Post>): void;
}

export interface Params$Resource$Posts$Delete extends StandardParameters {
	/**
	 *
	 */
	blogId?: string;
	/**
	 *
	 */
	postId?: string;
	/**
	 * Move to Trash if possible
	 */
	useTrash?: boolean;
}
export interface Params$Resource$Posts$Get extends StandardParameters {
	/**
	 *
	 */
	blogId?: string;
	/**
	 *
	 */
	fetchBody?: boolean;
	/**
	 *
	 */
	fetchImages?: boolean;
	/**
	 *
	 */
	maxComments?: number;
	/**
	 *
	 */
	postId?: string;
	/**
	 *
	 */
	view?: string;
}
export interface Params$Resource$Posts$Getbypath extends StandardParameters {
	/**
	 *
	 */
	blogId?: string;
	/**
	 *
	 */
	maxComments?: number;
	/**
	 *
	 */
	path?: string;
	/**
	 *
	 */
	view?: string;
}
export interface Params$Resource$Posts$Insert extends StandardParameters {
	/**
	 *
	 */
	blogId?: string;
	/**
	 *
	 */
	fetchBody?: boolean;
	/**
	 *
	 */
	fetchImages?: boolean;
	/**
	 *
	 */
	isDraft?: boolean;
	/**
	 * Request body metadata
	 */
	requestBody?: Schema$Post;
}
export interface Params$Resource$Posts$List extends StandardParameters {
	/**
	 *
	 */
	blogId?: string;
	/**
	 *
	 */
	endDate?: string;
	/**
	 *
	 */
	fetchBodies?: boolean;
	/**
	 *
	 */
	fetchImages?: boolean;
	/**
	 *
	 */
	labels?: string;
	/**
	 *
	 */
	maxResults?: number;
	/**
	 *
	 */
	orderBy?: string;
	/**
	 *
	 */
	pageToken?: string;
	/**
	 * Sort direction applied to post list.
	 */
	sortOption?: string;
	/**
	 *
	 */
	startDate?: string;
	/**
	 *
	 */
	status?: string[];
	/**
	 *
	 */
	view?: string;
}
export interface Params$Resource$Posts$Patch extends StandardParameters {
	/**
	 *
	 */
	blogId?: string;
	/**
	 *
	 */
	fetchBody?: boolean;
	/**
	 *
	 */
	fetchImages?: boolean;
	/**
	 *
	 */
	maxComments?: number;
	/**
	 *
	 */
	postId?: string;
	/**
	 *
	 */
	publish?: boolean;
	/**
	 *
	 */
	revert?: boolean;
	/**
	 * Request body metadata
	 */
	requestBody?: Schema$Post;
}
export interface Params$Resource$Posts$Publish extends StandardParameters {
	/**
	 *
	 */
	blogId?: string;
	/**
	 *
	 */
	postId?: string;
	/**
	 *
	 */
	publishDate?: string;
}
export interface Params$Resource$Posts$Revert extends StandardParameters {
	/**
	 *
	 */
	blogId?: string;
	/**
	 *
	 */
	postId?: string;
}
export interface Params$Resource$Posts$Search extends StandardParameters {
	/**
	 *
	 */
	blogId?: string;
	/**
	 *
	 */
	fetchBodies?: boolean;
	/**
	 *
	 */
	orderBy?: string;
	/**
	 *
	 */
	q?: string;
}
export interface Params$Resource$Posts$Update extends StandardParameters {
	/**
	 *
	 */
	blogId?: string;
	/**
	 *
	 */
	fetchBody?: boolean;
	/**
	 *
	 */
	fetchImages?: boolean;
	/**
	 *
	 */
	maxComments?: number;
	/**
	 *
	 */
	postId?: string;
	/**
	 *
	 */
	publish?: boolean;
	/**
	 *
	 */
	revert?: boolean;
	/**
	 * Request body metadata
	 */
	requestBody?: Schema$Post;
}
