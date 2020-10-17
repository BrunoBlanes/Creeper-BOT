import { Octokit } from '../Services/Octokit';

export class Reference {
	/**
	 * List matching references.
	 * https://docs.github.com/en/rest/reference/git#list-matching-references
	 * @param owner
	 * @param repo
	 * @param ref
	 */
	public static async ListAsync(owner: string, repo: string, ref: string): Promise<Reference[]> {
		let response = await Octokit.Client.request('GET /repos/:owner/:repo/git/matching-refs/:ref', {
			owner: owner,
			repo: repo,
			ref: ref
		});

		if (response.status === 200) return response.data as Reference[];
		throw new Error(`Could list git references matching ${ref} on repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Create a reference.
	 * https://docs.github.com/en/rest/reference/git#create-a-reference
	 * @param owner
	 * @param repo
	 * @param refName
	 * @param sha
	 */
	public static async CreateAsync(owner: string, repo: string, refName: string, sha: string): Promise<Reference> {
		let response = await Octokit.Client.request('POST /repos/:owner/:repo/git/refs', {
			owner: owner,
			repo: repo,
			ref: refName,
			sha: sha
		});

		if (response.status === 201) return response.data as Reference;
		throw new Error(`Could not create git reference ${refName} on repository "${repo}" of owner "${owner}".\n Octokit returned error ${response.status}.`);
	}
}

export interface Head {
	type: string;
	sha: string;
	url: string;
}

export interface Reference {
	ref: string;
	node_id: string;
	url: string;
	object: Head;
}