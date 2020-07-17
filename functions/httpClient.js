var jwt = require('jsonwebtoken');
var request = require('request-promise');
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');
// // DefaultAzureCredential expects the following three environment variables:
// // - AZURE_TENANT_ID: The tenant ID in Azure Active Directory
// // - AZURE_CLIENT_ID: The application (client) ID registered in the AAD tenant
// // - AZURE_CLIENT_SECRET: The client secret for the registered application

const credential = new DefaultAzureCredential();
const client = new SecretClient('https://Creeper-Bot-KeyVault.vault.azure.net', credential);

async function generateJwtToken() {
	let secret = await client.getSecret("GitHub-PrivateKey");
	let cert = Buffer.from(secret['value']);
	var token = jwt.sign({ iss: 72569 },
		cert, {
		algorithm: 'RS256',
		expiresIn: '10m'
	});
	return token;
}

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
			'Authorization': `Bearer ${await generateJwtToken()}`,
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