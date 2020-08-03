import { HttpClient } from '../Services';

export class Issue {

	// Returns a list of labels from an issue
	public static async GetLabelsAsync(issueUrl: string, installationId: string): Promise<Array<any>> {
		let body = await HttpClient.GetAsync(issueUrl, installationId);
		return body['labels'];
	}

	// Add labels to the issue
	public static async AddLabelAsync(labels: Array<string>, issueUrl: string, installationId: string): Promise<void> {
		await HttpClient.PostAsync(issueUrl + '/labels', labels, installationId);
	}

	// Removes labels from an issue
	public static async RemoveLabelsAsync(labels: Array<string>, issueUrl: string, installationId: string): Promise<void> {
		let issueLabels = await this.GetLabelsAsync(issueUrl, installationId);
		issueLabels.forEach(function (label) {
			for (let i = 0; i < labels.length; i++) {
				if (label['name'] == labels[i]) {
					labels.splice(i, 1);
					break;
				}
			}
		});
	}

	// Assign user to an issue
	public static async AssignUserAsync(user: string, reposUrl: string, issueUrl: string, installationId: string): Promise<any> {
		let response = await HttpClient.GetAsync(reposUrl + `/assignees/${user}`, installationId);

		// Can assign myself to the issue
		if (!response) {
			return await HttpClient.PostAsync(issueUrl + '/assignees', { 'assignees': [user] }, installationId);
		} else {
			throw new Error(`Cannot assign user ${user} to issue at ${issueUrl}`);
		}
	}

	// Updates an issue's label list and milestone
	private static async UpdateAsync(issueUrl: string, labels: any, milestoneNumber: number, installationId: string): Promise<void> {
		if (milestoneNumber == -1) {
			await HttpClient.PatchAsync(issueUrl, { 'labels': labels }, installationId);
		} else {
			await HttpClient.PatchAsync(issueUrl, {
				'milestone': milestoneNumber,
				'labels': labels
			}, installationId);
		}
	}
}

export class Label {

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

// Returns a list of labels with removals and/or aditions
async function spliceLabels(remove, add, issueUrl, labelsUrl, installationId) {
	let labels = await removeLabels(remove, issueUrl, installationId);
	if (add) {
		labels = await addLabels(add, null, labelsUrl, installationId, labels);
	}

	return labels;
}

// Get a label by name
async function getLabel(labelsUrl, label, installationId) {
	let body = await httpClient.Get(labelsUrl + `/${label}`, installationId);
	return body;
}

// Add labels from an issue
async function addLabels(addLabels, issueUrl, labelsUrl, installationId, labels = null) {
	if (issueUrl) {
		let labels = await getIssueLabels(issueUrl, installationId);
		for (var i = 0; i < addLabels.length; i++) {
			let promise = getLabel(labelsUrl, addLabels[i], installationId);
			let label = await promise;
			labels.push(JSON.parse(label));
		}
		return labels;

		// Adds to an existing list
	} else if (labels) {
		for (var i = 0; i < addLabels.length; i++) {
			let label = await getLabel(labelsUrl, addLabels[i], installationId);
			labels.push(JSON.parse(label));
		}
		return labels;
	} else {
		throw new Error('At: issues.addLabels: parameters "issueUrl" and "labels" cannot both be null');
	}
}

// Get milestone number by name
async function getMilestoneNumber(name, milestonesUrl, installationId) {
	let body = await httpClient.Get(milestonesUrl, installationId);
	body = JSON.parse(body);
	for (var i = 0; i < body.length; i++) {
		if (body[i]['title'] == name) {
			return body[i]['number'];
			break;
		}
	}
}