const jwt = require('jsonwebtoken');
const request = require('request');
const http = require('http');
const fs = require('fs');

const port = 5858;
const appId = 72569;
const hostname = 'localhost';
const cert = fs.readFileSync('repobot-private-key.pem');

const gitHubApi = 'https://api.github.com'

// Project's "Triage" column id
const android = 8474424;
const windows = 8474428;
const wasm = 8474431;
const ios = 8474386;
const api = 8474435;

const token = jwt.sign({ iss: appId },
	cert, {
	algorithm: 'RS256',
	expiresIn: '10m'
});

const server = http.createServer((req, res) => {
	// Only run on POST requests
	if (req.method == 'POST') {
		let body = '';
		req.on('data', chunk => {
			body += chunk;
		});

		// Parse as json
		req.on('end', () => {
			body = JSON.parse(body);
			let installationId = body['installation']['id'];
			// New issue opened
			if (body['action'] == 'opened' && body['issue']) {
				let issueId = body['issue']['id'];
				let labelsUrl = body['issue']['labels_url'].replace('{/name}', '');
				// Assigns label 'Triage' to issue
				labelToIssue(labelsUrl, ['Triage'], installationId).then(function (body) {
					console.log(body);
				}).then(function () {
					// Assigns myself to this issue
					userToIssue(body, 'BrunoBlanes', installationId).then(function (body) {
						console.log(body);
					}).then(function () {
						let labels = body['issue']['labels'];
						for (i = 0; i < labels.length; i++) {
							// Assigns this issue to the 'WebAssembly' project
							if (labels[i]['name'] == 'Identity' || labels[i]['name'] == 'WebAssembly') {
								issueToProject(issueId, wasm, installationId).then(function (body) {
									console.log(body);
									break;
								}).catch(function (error) {
									console.log(error);
									break;
								});
								// Assigns this issue to the 'Server' project
							} else if (labels[i]['name'] == 'API' || labels[i]['name'] == 'Database') {
								issueToProject(issueId, api, installationId).then(function (body) {
									console.log(body);
									break;
								}).catch(function (error) {
									console.log(error);
									break;
								});
								// Assigns this issue to the 'Windows' project
							} else if (labels[i]['name'] == 'Windows') {
								issueToProject(issueId, windows, installationId).then(function (body) {
									console.log(body);
									break;
								}).catch(function (error) {
									console.log(error);
									break;
								});
								// Assigns this issue to the 'Android' project
							} else if (labels[i]['name'] == 'Android') {
								issueToProject(issueId, android, installationId).then(function (body) {
									console.log(body);
									break;
								}).catch(function (error) {
									console.log(error);
									break;
								});
								// Assigns this issue to the 'iOS' project
							} else if (labels[i]['name'] == 'iOS') {
								issueToProject(issueId, ios, installationId).then(function (body) {
									console.log(body);
									break;
								}).catch(function (error) {
									console.log(error);
									break;
								});
							}
						}
					}).catch(function (error) {
						console.log(error);
					});
				}).catch(function (error) {
					console.log(error);
				});
				res.end('ok');
				// Project card moved from one column to another
			} else if (body['action'] == 'moved' && body['project_card']) {
				// If card is related to an issue
				if (body['project_card']['content_url']) {
					let issueUrl = body['project_card']['content_url'];
					let columnUrl = body['project_card']['column_url'];
					let labelsUrl = body['repository']['labels_url'].replace('{/name}', '');
					let milestonesUrl = body['repository']['milestones_url'].replace('{/number}', '');
					// Updates the issue based on the current project column
					updateIssueBasedOnCard(columnUrl, issueUrl, milestonesUrl, labelsUrl, installationId)
						.then(function (body) {
							console.log(body);
						}).catch(function (error) {
							console.log(error);
						});
				}
			}
		});
	}
});

// Makes a POST request to GitHub
function post(url, installationId, json) {
	return new Promise(function (resolve, reject) {
		request.post(gitHubApi + `/app/installations/${installationId}/access_tokens`, {
			json: true,
			headers: setHeaders('Bearer', token),
		}, (error, res, body) => {
			if (error) {
				console.log(`statusCode: ${res.statusCode}`);
				reject(error);
			}
			request.post(url, {
				json: json,
				headers: setHeaders('token', body['token']),
			}, (error, res, body) => {
				console.log(`POST: ${url}`);
				if (error) {
					console.log(`statusCode: ${res.statusCode}`);
					reject(error);
				};
				console.log(`statusCode: ${res.statusCode}`);
				resolve(body);
			});
		});
	});
};

// Makes a PATCH request to GitHub
function patch(url, installationId, json) {
	return new Promise(function (resolve, reject) {
		request.post(gitHubApi + `/app/installations/${installationId}/access_tokens`, {
			json: true,
			headers: setHeaders('Bearer', token),
		}, (error, res, body) => {
			if (error) {
				console.log(`statusCode: ${res.statusCode}`);
				reject(error);
			}
			request.patch(url, {
				json: json,
				headers: setHeaders('token', body['token']),
			}, (error, res, body) => {
				console.log(`PATCH: ${url}`);
				if (error) {
					console.log(`statusCode: ${res.statusCode}`);
					reject(error);
				};
				console.log(`statusCode: ${res.statusCode}`);
				resolve(body);
			});
		});
	});
};

// Makes a GET request to GitHub
function get(url, installationId) {
	return new Promise(function (resolve, reject) {
		request.post(gitHubApi + `/app/installations/${installationId}/access_tokens`, {
			json: true,
			headers: setHeaders('Bearer', token),
		}, (error, res, body) => {
			if (error) {
				console.log(`statusCode: ${res.statusCode}`);
				reject(error);
			}
			request.get(url, {
				headers: setHeaders('token', body['token']),
			}, (error, res, body) => {
				console.log(`GET: ${url}`);
				if (error) {
					console.log(`statusCode: ${res.statusCode}`);
					reject(error);
				} else if (res.statusCode == 404) {
					console.log(`statusCode: ${res.statusCode}`);
					reject();
				} else {
					console.log(`statusCode: ${res.statusCode}`);
					resolve(body);
				}
			});
		});
	});
};

// Set headers for the GitHub Api
function setHeaders(type, token) {
	if (type == 'Bearer') {
		return {
			'Authorization': `${type} ${token}`,
			'User-Agent': 'BrunoBlanes',
			'Accept': 'application/vnd.github.machine-man-preview+json'
		};
	}
	return {
		'Authorization': `${type} ${token}`,
		'User-Agent': 'BrunoBlanes',
		'Accept': 'application/vnd.github.inertia-preview+json'
	};
};

// Adds a cool section divider to the log
function logSection(title) {
	const maxSize = 115;
	var textSize = title.length + 4;
	var margin = '='.repeat((maxSize - textSize) / 2);
	console.log('\x1b[36m\n\n ' + '='.repeat(maxSize) + '');
	if ((margin.length * 2 + textSize) % 2 == 0) {
		console.log(` ${margin}  ${title}  ${margin}=`);
	} else {
		console.log(` ${margin}  ${title}  ${margin}`);
	}
	console.log(' ' + '='.repeat(maxSize) + '\n\x1b[0m');
}

// Adds a label to the issue
function labelToIssue(labelsUrl, labels, installationId) {
	return new Promise(function (resolve, reject) {
		logSection(`ADD "${label}" LABEL TO ISSUE`);
		post(labelsUrl, installationId, labels)
			.then(function (body) {
				resolve(body);
			}).catch(function (error) {
				reject(error);
			});
	});
}

// Assign user to an issue
function userToIssue(body, user, installationId) {
	return new Promise(function (resolve, reject) {
		logSection('ASSIGN SELF TO ISSUE');
		// Checks if I can assign myself to the issue
		get(`${body['issue']['repository_url']}/assignees/${user}`, installationId)
			.then(function () {
				// Assign myself to the issue
				console.log('');
				post(`${body['issue']['url']}/assignees`, installationId, { 'assignees': [user] })
					.then(function (body) {
						resolve(body);
					}).catch(function (error) {
						reject(error);
					});
		}).catch(function (error) {
			if (error) {
				reject(error);
			}
		});
	});
}

// Adds the issue to a specific project column
function issueToProject(issue, project, installationId) {
	return new Promise(function (resolve, reject) {
		logSection('ASSIGN ISSUE TO PROJECT');
		post(gitHubApi + `/projects/columns/${project}/cards`, installationId, {
			'content_id': issue,
			'content_type': 'Issue'
		}).then(function (body) {
			resolve(body);
		}).catch(function (error) {
			reject(error);
		});
	});
}

// Updates an issue based on the current project column
function updateIssueBasedOnCard(columnUrl, issueUrl, milestonesUrl, labelsUrl, installationId) {
	return new Promise(function (resolve, reject) {
		logSection(`UPDATE ISSUE BASED ON A PROJECT'S CARD MOVEMENT`);
		getColumnName(columnUrl, installationId).then(function (columnName) {
			console.log('');
			// Moved to column 'Triage'
			if (columnName == 'Triage') {
				issueToTriage(issueUrl, labelsUrl, installationId).then(function (body) {
					resolve(body);
				}).catch(function (error) {
					reject(error);
				});
			// Moved to column 'In progress'
			} else if (columnName == 'In progress') {
				issueToWorking(issueUrl, labelsUrl, installationId).then(function (body) {
					resolve(body);
				}).catch(function (error) {
					reject(error);
				});
			// Moved to column 'Done'
			} else if (columnName == 'Done') {
				issueToDone(issueUrl, labelsUrl, installationId).then(function (body) {
					resolve(body);
				}).catch(function (error) {
					reject(error);
				});
			} else {
				// Moved to a milestone column
				issueToMilestone(milestonesUrl, issueUrl, columnName, installationId)
					.then(function (body) {
						resolve(body);
					}).catch(function (error) {
						reject(error);
					});
			}
		}).catch(function (error) {
			reject(error);
		});
	});
}

// Updates an issue
function updateIssue(issueUrl, milestoneNumber, labels, installationId) {
	return new Promise(function (resolve, reject) {
		if (milestoneNumber == 0) {
			patch(issueUrl, installationId, {
				'labels': labels
			}).then(function (body) {
				resolve(body);
			}).catch(function (error) {
				reject(error);
			});
		} else {
			patch(issueUrl, installationId, {
				'milestone': milestoneNumber,
				'labels': labels
			}).then(function (body) {
				resolve(body);
			}).catch(function (error) {
				reject(error);
			});
		}
	});
}

// Get project column name by column url
function getColumnName(url, installationId) {
	return new Promise(function (resolve, reject) {
		get(url, installationId)
			.then(function (body) {
				body = JSON.parse(body);
				resolve(body['name']);
			}).catch(function (error) {
				reject(error);
			});
	});
}

// Get milestone number by name
function getMilestoneNumber(milestonesUrl, name, installationId) {
	return new Promise(function (resolve, reject) {
		get(milestonesUrl, installationId).then(function (body) {
			body = JSON.parse(body);
			for (i = 0; i < body.length; i++) {
				if (body[i]['title'] == name) {
					resolve(body[i]['number']);
					break;
				}
			}
		}).catch(function (error) {
			reject(error);
		});
	});
}

// Returns a list of labels from an issue
function getIssueLabels(issueUrl, installationId) {
	return new Promise(function (resolve, reject) {
		get(issueUrl, installationId).then(function (body) {
			body = JSON.parse(body);
			resolve(body['labels']);
		}).catch(function (error) {
			reject(error);
		});
	});
}

// Get a label by name
function getLabel(labelsUrl, installationId) {
	return new Promise(function (resolve, reject) {
		get(labelsUrl, installationId).then(function (body) {
			resolve(body);
		}).catch(function (error) {
			reject(error);
		});
	});
}

// Updates an issue who's project card was moved back to 'Triage'
function issueToTriage(issueUrl, labelsUrl, installationId) {
	return new Promise(function (resolve, reject) {
		getIssueLabels(issueUrl, installationId).then(function (labels) {
			console.log('');
			// Removes the following labels if exists
			for (i = 0; i < labels.length; i++) {
				if (labels[i]['name'] == 'Working' || labels[i]['name'] == 'Done'
					|| labels[i]['name'] == 'Fixed') {
					labels.splice(i, 1);
					break;
				}
			}
			getLabel(labelsUrl + '/Triage', installationId).then(function (label) {
				labels.push(JSON.parse(label));
				console.log('');
				updateIssue(issueUrl, null, labels, installationId)
					.then(function (body) {
						resolve(body);
					}).catch(function (error) {
						reject(error);
					});
			}).catch(function (error) {
				reject(error);
			});
		}).catch(function (error) {
			reject(error);
		});
	});
}

// Updates an issue who's project card was moved back to 'In progress'
function issueToWorking(issueUrl, labelsUrl, installationId) {
	return new Promise(function (resolve, reject) {
		getIssueLabels(issueUrl, installationId).then(function (labels) {
			console.log('');
			// Removes the following labels if exists
			for (i = 0; i < labels.length; i++) {
				if (labels[i]['name'] == 'Triage' || labels[i]['name'] == 'Done'
					|| labels[i]['name'] == 'Fixed') {
					labels.splice(i, 1);
					break;
				}
			}
			getLabel(labelsUrl + '/Working', installationId).then(function (label) {
				labels.push(JSON.parse(label));
				console.log('');
				updateIssue(issueUrl, 0, labels, installationId)
					.then(function (body) {
						resolve(body);
					}).catch(function (error) {
						reject(error);
					});
			}).catch(function (error) {
				reject(error);
			});
		}).catch(function (error) {
			reject(error);
		});
	});
}

// Updates an issue who's project card was moved back to 'Done'
function issueToDone(issueUrl, labelsUrl, installationId) {
	return new Promise(function (resolve, reject) {
		getIssueLabels(issueUrl, installationId).then(function (labels) {
			console.log('');
			// Removes the following labels if exists
			for (i = 0; i < labels.length; i++) {
				if (labels[i]['name'] == 'Triage' || labels[i]['name'] == 'Working') {
					labels.splice(i, 1);
					break;
				}
			}
			for (i = 0; i < labels.length; i++) {
				if (labels[i]['name'] == 'Bug') {
					getLabel(labelsUrl + '/Fixed', installationId).then(function (label) {
						labels.push(JSON.parse(label));
						console.log('');
						updateIssue(issueUrl, 0, labels, installationId)
							.then(function (body) {
								resolve(body);
							}).catch(function (error) {
								reject(error);
							});
					}).catch(function (error) {
						reject(error);
					});
					break;
				}
				// Did not find a 'Bug' label
				if (i == labels.length - 1) {
					getLabel(labelsUrl + '/Done', installationId).then(function (label) {
						labels.push(JSON.parse(label));
						console.log('');
						updateIssue(issueUrl, 0, labels, installationId)
							.then(function (body) {
								resolve(body);
							}).catch(function (error) {
								reject(error);
							});
					}).catch(function (error) {
						reject(error);
					});
				}
			}
		}).catch(function (error) {
			reject(error);
		});
	});
}

//Updates an issue who's project card was moved to a milestone column
function issueToMilestone(milestonesUrl, issueUrl, columnName, installationId) {
	return new Promise(function (resolve, reject) {
		getMilestoneNumber(milestonesUrl, columnName, installationId)
			.then(function (milestoneNumber) {
				console.log('');
				getIssueLabels(issueUrl, installationId).then(function (labels) {
					console.log('');
					// Removes the following labels if exists
					for (i = 0; i < labels.length; i++) {
						if (labels[i]['name'] == 'Triage' || labels[i]['name'] == 'Working'
							|| labels[i]['name'] == 'Done' || labels[i]['name'] == 'Fixed') {
							labels.splice(i, 1);
							break;
						}
					}
					// Updates the issue
					updateIssue(issueUrl, milestoneNumber, labels, installationId)
						.then(function (body) {
							resolve(body);
						}).catch(function (error) {
							reject(error);
						});
				}).catch(function (error) {
					reject(error);
				});
			}).catch(function (error) {
				reject(error);
			});
	});
}

// Starts the server
server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});