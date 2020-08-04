import { HttpClient } from '../Services';
import { Creator } from './Creator';

export default class Milestone {
	id: number;
	url: string;
	due_on: Date;
	state: string;
	title: string;
	number: number;
	node_id: string;
	closed_at: Date;
	creator: Creator;
	created_at: Date;
	updated_at: Date;
	html_url: string;
	labels_url: string;
	description: string;
	open_issues: number;
	closed_issues: number;
	
	/**
	 * List milestones
	 * https://docs.github.com/en/rest/reference/issues#list-milestones
	 * @param milestonesUrl
	 * @param installationId
	 */
	public static async ListAsync(
		milestonesUrl: string,
		installationId: string): Promise<Array<Milestone>> {
		return await HttpClient.GetAsync(milestonesUrl, installationId);
	}

	/**
	 * Get milestone id
	 * @param name
	 * @param milestonesUrl
	 * @param installationId
	 */
	public static async GetIdAsync(
		name: string,
		milestonesUrl: string,
		installationId: string): Promise<number> {
		let milestones = await this.ListAsync(milestonesUrl, installationId);
		milestones.forEach(function (milestone) {
			if (milestone.title == name) {
				return milestone.number;
			}
		});

		throw new Error(`Couldn't find a milestone named "${name}".`);
	}
}