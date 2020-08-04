export default interface Creator {
	id: number;
	url: string;
	type: string;
	login: string;
	node_id: string;
	html_url: string;
	gists_url: string;
	repos_url: string;
	events_url: string;
	avatar_url: string;
	gravatar_id: string;
	site_admin: boolean;
	starred_url: string;
	followers_url: string;
	following_url: string;
	subscriptions_url: string;
	organizations_url: string;
	received_events_url: string;
}