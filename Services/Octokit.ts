import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/core';
import { Azure } from './Azure';

export const octokit = new Octokit({
	authStrategy: createAppAuth,
	auth: {
		id: 72569,
		privateKey: Azure.PrivateKey
	},
	previews: [
		'machine-man'
	],
	userAgent: 'Creeper-Bot',
	timeZone: 'America/Sao_Paulo'
});