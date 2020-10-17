import { Octokit } from '../Services/Octokit';
import { User } from './User';

export class Release {
	/**
	 * Create a release.
	 * https://docs.github.com/en/rest/reference/repos#create-a-release
	 * @param owner
	 * @param repo
	 * @param name
	 * @param draft
	 * @param prerelease
	 */
	public static async CreateAsync(owner: string, repo: string, name: string, draft: boolean = false, prerelease: boolean = false): Promise<Release> {
		let response = await Octokit.Client.request('POST /repos/:owner/:repo/releases', {
			owner: owner,
			repo: repo,
			tag_name: name,
			name: name,
			draft: draft,
			prerelease: prerelease
		});

		if (response.status === 201) return response.data as Release;
		throw new Error(`Could create release on repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * List releases.
	 * https://docs.github.com/en/rest/reference/repos#list-releases
	 * @param owner
	 * @param repo
	 */
	public static async ListAsync(owner: string, repo: string): Promise<Release[]> {
		let response = await Octokit.Client.request('GET /repos/:owner/:repo/releases', {
			owner: owner,
			repo: repo
		});

		if (response.status === 200) return response.data as Release[];
		throw new Error(`Could list releases on repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
	}
}

export interface Asset {
	url: string;
	browser_download_url: string;
	id: number;
	node_id: string;
	name: string;
	label: string;
	state: string;
	content_type: string;
	size: number;
	download_count: number;
	created_at: string;
	updated_at: string;
	uploader: User;
}

export interface Release {
	url: string;
	html_url: string;
	assets_url: string;
	upload_url: string;
	tarball_url: string;
	zipball_url: string;
	id: number;
	node_id: string;
	tag_name: string;
	target_commitish: string;
	name: string;
	body: string;
	draft: boolean;
	prerelease: boolean;
	created_at: string;
	published_at: string;
	author: User;
	assets: Asset[];
}