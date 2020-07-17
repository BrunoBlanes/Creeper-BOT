var httpClient = require(__dirname + '/../functions/httpClient');

module.exports = {
	// Updates an issue who's project card was moved back to 'Triage'
	ToTriage: async function (issueUrl, labelsUrl, installationId) {
		try {
			let labels = await spliceLabels(['Working', 'Done', 'Fixed'], ['Triage'], issueUrl, labelsUrl, installationId);
			let body = await updateIssue(issueUrl, null, labels, installationId);
			return body;
		} catch (err) {
			return err;
		}
	},

	// Updates an issue who's project card was moved back to 'In progress'
	ToWorking: async function (issueUrl, labelsUrl, installationId) {
		try {
			let labels = await spliceLabels(['Triage', 'Done', 'Fixed'], ['Working'], issueUrl, labelsUrl, installationId);
			let body = updateIssue(issueUrl, 0, labels, installationId);
			return body;
		} catch(err) {
			return err;
		}
	},

	// Updates an issue who's project card was moved to 'Done'
	ToDone: async function (issueUrl, labelsUrl, installationId) {
		try {
			let labels = await spliceLabels(['Triage', 'Working'], ['Awaiting Pull Request'], issueUrl, labelsUrl, installationId);
			for (var i = 0; i < labels.length; i++) {
				// Adds 'Fixed' if 'Bug' label is present
				if (labels[i]['name'] == 'Bug') {
					labels = await addLabels(['Fixed'], 0, labelsUrl, installationId, labels);
					let body = updateIssue(issueUrl, 0, labels, installationId);
					return body;
					break;
				}

				// Adds 'Complete' if 'Task' is present
				if (labels[i]['name'] == 'Task') {
					labels = await addLabels(['Complete'], 0, labelsUrl, installationId, labels);
					let body = await updateIssue(issueUrl, 0, labels, installationId);
					return body;
					break;
				}
			}
		} catch(err) {
			return err;
		}
	},

	//Updates an issue who's project card was moved to a milestone column
	ToMilestone: async function (columnName, milestonesUrl, issueUrl, labelsUrl, installationId) {
		try {
			let milestoneNumber = await getMilestoneNumber(columnName, milestonesUrl, installationId);
			let labels = await spliceLabels(['Triage', 'Done', 'Fixed', 'Working'], null, issueUrl, labelsUrl, installationId);
			let body = await updateIssue(issueUrl, milestoneNumber, labels, installationId);
			return body;
		} catch (err) {
			return err;
		}
	},

	// Add labelS to the issue
	AssignLabelsToIssue: async function (labels, issueUrl, installationId) {
		try {
			let body = await httpClient.Post(issueUrl + '/labels', installationId, labels);
			return body;
		} catch (err) {
			return err;
		}
	},

	// Assign user to an issue
	AssignUserToIssue: async function (user, reposUrl, issueUrl, installationId) {
		try {
			let response = await httpClient.Get(reposUrl + `/assignees/${user}`, installationId);

			// Checks if I can assign myself to the issue
			if (!response) {
				let body = await httpClient.Post(issueUrl + '/assignees', installationId, { 'assignees': [user] });
				return body;
			} else {
				throw new Error(`Cannot assign user ${user} to issue at ${issueUrl}`);
			}
		} catch (err) {
			return err;
		}
	},
};

// Returns a list of labels from an issue
async function getIssueLabels(issueUrl, installationId) {
	let body = await httpClient.Get(issueUrl, installationId);
	body = JSON.parse(body);
	return body['labels'];
}

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

// Removes labels from an issue
async function removeLabels(removeLabels, issueUrl, installationId) {
	let labels = await getIssueLabels(issueUrl, installationId);
	for (var i = 0; i < labels.length; i++) {
		for (var j = 0; j < removeLabels.length; j++) {
			if (labels[i]['name'] == removeLabels[j]) {
				labels.splice(i, 1);
				break;
			}
		}
	}

	return labels;
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

// Updates an issue's label list and milestone
async function updateIssue(issueUrl, milestoneNumber, labels, installationId) {
	if (milestoneNumber == 0) {
		let body = await httpClient.Patch(issueUrl, installationId, { 'labels': labels });
		return body;
	} else {
		let body = await httpClient.Patch(issueUrl, installationId, {
			'milestone': milestoneNumber,
			'labels': labels
		});
		return body;
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