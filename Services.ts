import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';
import Axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { DefaultAzureCredential } from '@azure/identity';
import * as JWT from 'jsonwebtoken';
import * as Crypto from 'crypto';

const credential = new DefaultAzureCredential();
const httpClient = Axios.create({ baseURL: 'https://api.github.com', timeout: 1000 });
const client = new SecretClient('https://Creeper-Bot-KeyVault.vault.azure.net', credential);

export class HttpClient {

	// Makes a GET request to GitHub
	public static async GetAsync(path: string, installationId: string): Promise<any> {
		const config: AxiosRequestConfig = { headers: await this.SetHeadersAsync(installationId) };
		let response = await httpClient.get(path, config).catch(err => { this.AxiosErrorHandler(err); });
		console.log(`GET: ${path}`);
		console.log(`Status code: ${response['status']}\n`);
		return JSON.parse(response['data']);
	}

	// Makes a POST request to GitHub
	public static async PostAsync(path: string, data: any, installationId: string): Promise<any> {
		const config: AxiosRequestConfig = { headers: await this.SetHeadersAsync(installationId) };
		let response = await httpClient.post(path, data, config).catch(err => { this.AxiosErrorHandler(err); });
		console.log(`POST: ${path}`);
		console.log(`Status code: ${response['status']}\n`);
		return JSON.parse(response['data']);
	}

	// Makes a PATCH request to GitHub
	public static async PatchAsync(path: string, data: any, installationId: string): Promise<any> {
		const config: AxiosRequestConfig = {
			data: data,
			method: 'PATCH',
			headers: await this.SetHeadersAsync(installationId)
		};
		let response = await httpClient(path, config).catch(err => { this.AxiosErrorHandler(err); });
		console.log(`PATCH: ${path}`);
		console.log(`Status code: ${response['status']}\n`);
		return JSON.parse(response['data']);
	}

	// Set headers for the GitHub Api
	private static async SetHeadersAsync(installationId: string) {
		return {
			'User-Agent': 'BrunoBlanes',
			'Authorization': `token ${await this.AuthenticateAsync(installationId)}`,
			'Accept': 'application/vnd.github.inertia-preview+json'
		};
	}

	// Gets an access token from the api
	private static async AuthenticateAsync(installationId: string): Promise<string> {
		const path: string = `/app/installations/${installationId}/access_tokens`;
		const config: AxiosRequestConfig = {
			headers: {
				'User-Agent': 'BrunoBlanes',
				'Authorization': `Bearer ${await this.GenerateJwtTokenAsync()}`,
				'Accept': 'application/vnd.github.machine-man-preview+json'
			}
		};

		let response = await httpClient.post(path, config);
		return response['data']['token'];
	}

	// Generates a JWT token to sign requests
	private static async GenerateJwtTokenAsync(): Promise<string> {
		let secret: KeyVaultSecret = await client.getSecret("GitHub-PrivateKey");
		let cert: Buffer = Buffer.from(secret['value']);
		return JWT.sign({ iss: 72569 },
			cert, {
				algorithm: 'RS256',
				expiresIn: '10m'
			}
		);
	}

	// Handles Axios HTTP errors
	private static AxiosErrorHandler(err: AxiosError): void {
		throw new Error(`${err.config.url}`);
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