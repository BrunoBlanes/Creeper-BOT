import { HttpClient } from '../Services';
import Label from './Labels';

export default class Issue {
	/**
	 * Add assignees to an issue
	 * https://docs.github.com/en/rest/reference/issues#add-assignees-to-an-issue
	 * @param user
	 * @param issueUrl
	 * @param installationId
	*/
	public static async AssignUserAsync(
		user: Array<string>,
		issueUrl: string,
		installationId: string): Promise<void> {
		await HttpClient.PostAsync(`${issueUrl}/assignees`, { 'assignees': user }, installationId);
	}

	/**
	 * Update an issue
	 * https://docs.github.com/en/rest/reference/issues#update-an-issue
	 * @param labels
	 * @param milestone
	 * @param issueUrl
	 * @param installationId
	 */
	public static async UpdateAsync(
		labels: Array<string>,
		milestone: number,
		issueUrl: string,
		installationId: string): Promise<void> {
		await HttpClient.PatchAsync(issueUrl, {
			'milestone': milestone,
			'labels': labels
		}, installationId);
	}

	static Labels = class Labels extends Label {
		/**
		 * List labels for an issue
		 * https://docs.github.com/en/rest/reference/issues#list-labels-for-an-issue
		 * @param issueUrl
		 * @param installationId
		 */
		public static async ListAsync(
			issueUrl: string,
			installationId: string): Promise<Array<Label>> {
			return await HttpClient.GetAsync<Array<Label>>(`${issueUrl}/labels`, installationId);
		}

		/**
		 * Add labels to an issue
		 * https://docs.github.com/en/rest/reference/issues#add-labels-to-an-issue
		 * @param labels
		 * @param issueUrl
		 * @param installationId
		 */
		public static async AddAsync(
			labels: Array<string>,
			issueUrl: string,
			installationId: string): Promise<void> {
			await HttpClient.PostAsync(`${issueUrl}/labels`, { 'labels': labels }, installationId);
		}

		/**
		 * Set labels for an issue
		 * https://docs.github.com/en/rest/reference/issues#set-labels-for-an-issue
		 * @param labels
		 * @param issueUrl
		 * @param installationId
		 */
		public static async SetAsync(
			labels: Array<string>,
			issueUrl: string,
			installationId: string): Promise<void> {
			await HttpClient.PutAsync(`${issueUrl}/labels`, { 'labels': labels }, installationId);
		}

		/**
		 * Remove a label from an issue
		 * https://docs.github.com/en/rest/reference/issues#remove-a-label-from-an-issue
		 * @param label
		 * @param issueUrl
		 * @param installationId
		 */
		public static async RemoveAsync(
			label: string,
			issueUrl: string,
			installationId: string): Promise<void> {
			await HttpClient.DeleteAsync(`${issueUrl}/labels/${label}`, installationId);
		}

		/**
		 * Remove all labels from an issue
		 * https://docs.github.com/en/rest/reference/issues#remove-all-labels-from-an-issue
		 * @param issueUrl
		 * @param installationId
		 */
		public static async RemoveAllAsync(
			issueUrl: string,
			installationId: string): Promise<void> {
			await HttpClient.DeleteAsync(`${issueUrl}/labels`, installationId);
		}
	}
}


module.exports = {
	// Updates an issue who's project card was moved back to 'Triage'
	ToTriage: async function (issueUrl, labelsUrl, installationId) {
		try {
			let labels = await spliceLabels(['Working', 'Complete', 'Fixed'], ['Triage'], issueUrl, labelsUrl, installationId);
			let body = await updateIssue(issueUrl, null, labels, installationId);
			return body;
		} catch (err) {
			return err;
		}
	},

	// Updates an issue who's project card was moved back to 'In progress'
	ToWorking: async function (issueUrl, labelsUrl, installationId) {
		try {
			let labels = await spliceLabels(['Triage', 'Fixed', 'Complete'], ['Working'], issueUrl, labelsUrl, installationId);
			let body = updateIssue(issueUrl, 0, labels, installationId);
			return body;
		} catch (err) {
			return err;
		}
	},

	// Updates an issue who's project card was moved to 'Done'
	ToDone: async function (issueUrl, installationId) {
		try {
			let labels = await removeLabels(['Triage', 'Working'], issueUrl, installationId);
			let body = updateIssue(issueUrl, 0, labels, installationId);
			return body;
		} catch (err) {
			return err;
		}
	},

	//Updates an issue who's project card was moved to a milestone column
	ToMilestone: async function (columnName, milestonesUrl, issueUrl, installationId) {
		try {
			let milestoneNumber = await getMilestoneNumber(columnName, milestonesUrl, installationId);
			let labels = await removeLabels(['Triage', 'Complete', 'Fixed', 'Working'], issueUrl, installationId);
			let body = await updateIssue(issueUrl, milestoneNumber, labels, installationId);
			return body;
		} catch (err) {
			return err;
		}
	},

	// Updates the labels of an issue
	UpdateLabels: async function (addLabels, removeLabels, issueUrl, labelsUrl, installationId) {
		try {
			let labels = await spliceLabels(removeLabels, addLabels, issueUrl, labelsUrl, installationId);
			let body = await updateIssue(issueUrl, 0, labels, installationId);
			return body;
		} catch (err) {
			return err;
		}
	}
};