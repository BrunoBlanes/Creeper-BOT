var fs = require('fs');
var path = require('path');
var jwt = require('jsonwebtoken');
var request = require('request-promise');

var cert = fs.readFileSync(path.resolve(__dirname, '../repobot-private-key.pem'));

var token = jwt.sign({ iss: 72569 },
	cert, {
	algorithm: 'RS256',
	expiresIn: '10m'
});

// Makes a POST request to GitHub
module.exports = {
	Post: async function(url, installationId, json) {
		let token = await authenticate(installationId);
		const options = {
			url: url,
			json: json,
			method: 'POST',
			headers: setHeaders(token),
			resolveWithFullResponse: true,
		};
		let response = await request(options);
		console.log(`POST: ${url}`);
		console.log(`Status code: ${response.statusCode}\n`);
		return response.body;
	},

	// Makes a PATCH request to GitHub
	Patch: async function(url, installationId, json) {
		let token = await authenticate(installationId);
		const options = {
			url: url,
			json: json,
			method: 'PATCH',
			headers: setHeaders(token),
			resolveWithFullResponse: true,
		};
		let response = await request(options);
		console.log(`PATCH: ${url}`);
		console.log(`Status code: ${response.statusCode}\n`);
		return response.body;
	},

	// Makes a GET request to GitHub
	Get: async function(url, installationId) {
		let token = await authenticate(installationId);
		const options = {
			url: url,
			method: 'GET',
			headers: setHeaders(token),
			resolveWithFullResponse: true,
		};
		let response = await request(options);
		console.log(`GET: ${url}`);
		console.log(`Status code: ${response.statusCode}\n`);
		return response.body;
	},
};

// Gets an access token
async function authenticate(installationId) {
	const options = {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`,
			'User-Agent': 'BrunoBlanes',
			'Accept': 'application/vnd.github.machine-man-preview+json'
		},
		json: true,
		uri: `https://api.github.com/app/installations/${installationId}/access_tokens`,
	};
	let response = await request(options);
	return response['token'];
}

// Set headers for the GitHub Api
function setHeaders(token) {
	return {
		'Authorization': `token ${token}`,
		'User-Agent': 'BrunoBlanes',
		'Accept': 'application/vnd.github.inertia-preview+json'
	};
};