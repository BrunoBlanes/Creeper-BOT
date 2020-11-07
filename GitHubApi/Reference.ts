import { Octokit } from '../Services/Octokit';
import { Version } from './Release';
import '../Extensions/Arrays';

export class Reference {
	/**
	 * List matching references.
	 * https://docs.github.com/en/rest/reference/git#list-matching-references
	 * @param owner
	 * @param repo
	 * @param ref
	 */
	public static async ListAsync(owner: string, repo: string, ref?: string): Promise<Reference[]> {
		let response = await Octokit.Client.request('GET /repos/:owner/:repo/git/matching-refs/:ref', {
			owner: owner,
			repo: repo,
			ref: ref
		});

		if (response.status === 200) {
			let releases: Reference[] = [];

			for (let release of response.data) {
				releases.push(Object.assign(new Reference(), release));
			}

			return releases;
		}

		throw new Error(`Could list git references matching ${ref} on repository "${repo}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Create a reference.
	 * https://docs.github.com/en/rest/reference/git#create-a-reference
	 * @param owner
	 * @param repo
	 * @param ref The name of the fully qualified reference (ie: refs/heads/master). If it doesn't start with 'refs' and have at least two slashes, it will be rejected.
	 * @param sha The SHA1 value for this reference.
	 */
	public static async CreateAsync(owner: string, repo: string, ref: string, sha: string): Promise<Reference> {
		let response = await Octokit.Client.request('POST /repos/:owner/:repo/git/refs', {
			owner: owner,
			repo: repo,
			ref: ref,
			sha: sha
		});

		if (response.status === 201) {
			return Object.assign(new Reference(), response.data);
		}

		throw new Error(`Could not create git reference ${ref} on repository "${repo}".\n Octokit returned error ${response.status}.`);
	}

	/**
	 * Delete a reference.
	 * https://docs.github.com/en/free-pro-team@latest/rest/reference/git#delete-a-reference
	 * @param owner
	 * @param repo
	 * @param ref
	 */
	public static async DeleteAsync(owner: string, repo: string, ref: string): Promise<void> {
		let response = await Octokit.Client.request('DELETE /repos/:owner/:repo/git/refs/:ref', {
			owner: owner,
			repo: repo,
			ref: ref
		});

		if (response.status !== 204) {
			throw new Error(`Could not delete git reference ${ref} on repository "${repo}".\n Octokit returned error ${response.status}.`);
		}
	}

	public GetVersion(): Version | null {
		let referemce: string[] = this.ref.split('/');

		if (referemce[referemce.length - 2] === 'release') {
			let version: string[] = referemce.last().substring(1).split('.');
			return new Version(+version[0], +version[1], +version[2]);
		}

		return null;
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