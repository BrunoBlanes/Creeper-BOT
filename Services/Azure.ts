import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import * as Crypto from 'crypto';

const credential = new DefaultAzureCredential();
const client = new SecretClient('https://Creeper-Bot-KeyVault.vault.azure.net', credential);

export class Azure {
	private static privateKey: string | null | undefined;

	/* Returns my GitHub private key. */
	public static async GetPrivateKeyAsync(): Promise<string> {
		if (this.privateKey == null) {
			this.privateKey = (await client.getSecret("GitHub-PrivateKey")).value;
		}

		return this.privateKey;
	}
}

export class Validator {
	/**
	 * Validades signed webhooks from GitHub.
	 * @param payload The data to be validaded.
	 * @param sig The GitHub signature provided as header 'x-hub-signature'.
	 */
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