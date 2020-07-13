const jwt = require('jsonwebtoken');
const request = require('request');
const http = require('http');
const fs = require('fs');

const port = 5858;
const appId = 72569;
const hostname = 'localhost';
const cert = fs.readFileSync('repobot-private-key.pem');

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
			if (body['action'] == 'opened') {
				// Add the "Triage" label to the issue
				let labelResponse = post(
					body['issue']['labels_url'].replace('{/name}', ''),
					installationId,
					['Triage']);
				logSection('ADD "TRIAGE" LABEL TO ISSUE');
				labelResponse.then(function (body) {
					console.log(body);
				}).then(function () {
					// Checks if I can assign myself to the issue
					let canAssignResponse = get(`${body['issue']['repository_url']}/assignees/BrunoBlanes`);
					logSection('ASSIGN SELF TO ISSUE');
					canAssignResponse.then(function () {
						// Assign myself to the issue
						console.log('');
						let assignResponse = post(
							`${body['issue']['url']}/assignees`,
							installationId,
							{ 'assignees': ['BrunoBlanes']});
						assignResponse.then(function (body) {
							console.log(body);
						}).catch(function (error) {
							console.log(error);
						});
					}).catch(function (error) {
						if (error) {
							console.log(error);
						}
					});
				}).catch(function (error) {
					console.log(error);
				});
				res.end('ok');
			}
		});
	}
});

// Makes a POST request to GitHub
function post(url, id, json) {
	return new Promise(function (resolve, reject) {
		request.post(`https://api.github.com/app/installations/${id}/access_tokens`, {
			json: true,
			headers: setHeaders('Bearer', token),
		}, (error, res, body) => {
			console.log(`POST: ${url}`);

			if (error) {
				console.log(`statusCode: ${res.statusCode}`);
				reject(error);
			}

			request.post(url, {
				json: json,
				headers: setHeaders('token', body['token']),
			}, (error, res, body) => {
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
function get(url) {
	return new Promise(function (resolve, reject) {
		request.get(url, {
			headers: {
				'User-Agent': 'BrunoBlanes',
			},
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
};

// Set headers for the GitHub Api
function setHeaders(type, token) {
	return {
		'Authorization': `${type} ${token}`,
		'User-Agent': 'BrunoBlanes',
		'Accept': 'application/vnd.github.machine-man-preview+json'
	}
};

// Adds a cool section divider to the log
function logSection(title) {
	const maxSize = 116;
	var textSize = title.length + 4;
	var margin = '='.repeat((maxSize - textSize) / 2);
	console.log('\x1b[36m', '\n\n' + '='.repeat(maxSize) + '');
	if ((margin.length * 2 + textSize) % 2 == 0) {
		console.log(`${margin}  ${title}  ${margin}`);
	} else {
		console.log(`${margin}  ${title}  ${margin}=`);
	}
	console.log('='.repeat(maxSize) + '\n' + '\x1b[0m');
}

// Starts the server
server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});