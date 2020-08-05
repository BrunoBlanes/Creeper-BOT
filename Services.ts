import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/core';
import * as Crypto from 'crypto';

const credential = new DefaultAzureCredential();
const client = new SecretClient('https://Creeper-Bot-KeyVault.vault.azure.net', credential);
const keyVault = client.getSecret("GitHub-PrivateKey");
export const HttpClient = new Octokit({
	authStrategy: createAppAuth,
	auth: {
		id: 72569,
		privateKey: keyVault.then(function (value: KeyVaultSecret) { return value.value; })
	},
	previews: [
		'inertia',
	],
	userAgent: 'Creeper-Bot',
	timeZone: 'America/Sao_Paulo'
});

export class Validator {

	// Validades signed webhooks from GitHub
	public static async ValidateSecretAsync(payload: string, sig: string): Promise<boolean> {
		let secret: KeyVaultSecret = await client.getSecret("GitHub-Secret");
		if (payload) {
			let secretValue: string = secret['value'];
			const hmac: Crypto.Hmac = Crypto.createHmac('sha1', secretValue);
			const digest: Buffer = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8');
			const checksum: Buffer = Buffer.from(sig, 'utf8');
			if (checksum.length !== digest.length || !Crypto.timingSafeEqual(digest, checksum))
				return false;
			return true;
		}
	}
}