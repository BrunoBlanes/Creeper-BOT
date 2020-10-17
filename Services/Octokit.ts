import { Octokit as HttpClient } from '@octokit/core';
import { createAppAuth } from '@octokit/auth-app';
import { Azure } from './Azure';

export class Octokit {

	public static Client: HttpClient;

	public static async SetClientAsync(installationId: number): Promise<void> {
		this.Client = new HttpClient({
			authStrategy: createAppAuth,
			auth: {
				id: 72569,
				installationId: installationId,
				privateKey: await Azure.GetPrivateKeyAsync()
			},
			previews: [
				'machine-man'
			],
			log: {
				debug: console.debug,
				info: console.info,
				warn: console.warn,
				error: console.error
			},
			userAgent: 'Creeper-Bot',
			timeZone: 'America/Sao_Paulo'
		});
	}
}