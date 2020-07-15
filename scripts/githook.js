/*
 * Verify GitHub webhook signature header in Node.js
 * Written by stigok and others (see gist link for contributor comments)
 * https://gist.github.com/stigok/57d075c1cf2a609cb758898c0b202428
 * Licensed CC0 1.0 Universal
 */

const crypto = require('crypto');
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');
// // DefaultAzureCredential expects the following three environment variables:
// // - AZURE_TENANT_ID: The tenant ID in Azure Active Directory
// // - AZURE_CLIENT_ID: The application (client) ID registered in the AAD tenant
// // - AZURE_CLIENT_SECRET: The client secret for the registered application

const credential = new DefaultAzureCredential();
const client = new SecretClient('https://Creeper-Bot-KeyVault.vault.azure.net', credential);

module.exports = {
	ValidateSecret: async function (payload, sig) {
		let secret = await client.getSecret("GitHub-Secret");
		if (payload) {
			secret = secret['value'];
			const hmac = crypto.createHmac('sha1', secret);
			const digest = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8');
			const checksum = Buffer.from(sig, 'utf8');
			if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
				return false;
			}
			return true;
		}
	}
};