import { HttpClient } from '../Services';

export default class Label {
	id: number;
	url: string;
	name: string;
	color: string;
	node_id: string;
	default: boolean;
	description: string;

	/**
	 * Get a label
	 * https://docs.github.com/en/rest/reference/issues#get-a-label
	 * @param label
	 * @param labelsUrl
	 * @param installationId
	 */
	public async ListAsync(
		label: string,
		labelsUrl: string,
		installationId: string): Promise<Array<Label>> {
		return await HttpClient.GetAsync<Array<Label>>(`${labelsUrl}/${label}`, installationId);
	}
}