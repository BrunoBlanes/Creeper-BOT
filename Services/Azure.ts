import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import * as Crypto from 'crypto';

const credential = new DefaultAzureCredential();
const client = new SecretClient('https://Creeper-Bot-KeyVault.vault.azure.net', credential);

export class Azure {
	public static PrivateKey: string;

	public static async SetPrivateSecret(): Promise<void> {
		this.PrivateKey = (await client.getSecret("GitHub-PrivateKey")).value;
		console.log('Private key was set.');
	}
}

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