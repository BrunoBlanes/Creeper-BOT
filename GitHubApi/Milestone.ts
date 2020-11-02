import { Octokit } from '../Services/Octokit';
import { User } from './User';

export class Milestone {	
	/**
	 * List milestones.
	 * https://docs.github.com/en/rest/reference/issues#list-milestones
	 * @param owner
	 * @param repo
	 * @param state
	 */
	public static async ListAsync(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<Milestone[]> {
		let response = await Octokit.Client.request('GET /repos/:owner/:repo/milestones', {
			owner: owner,
			repo: repo,
			state: state
		});

		if (response.status === 200) {
			let milestones: Milestone[] = [];

			for (let milestone of response.data) {
				milestones.push(Object.assign(new Milestone(), milestone));
			}

			return milestones;
		}
		
		throw new Error(`Could not retrieve a list of milestones for repository "${repo}" of owner "${owner}"./n Octokit returned error ${response.status}.`);
	}
}

export interface Milestone {
	url: string;
	html_url: string;
	labels_url: string;
	id: number;
	node_id: string;
	number: number;
	title: string;
	description: string;
	creator: User;
	open_issues: number;
	closed_issues: number;
	state: string;
	created_at: Date;
	updated_at: Date;
	due_on: Date;
	closed_at: Date;
}