import Project from './GitHubApi/Projects';
import Issue from './GitHubApi/Issue';
import { Validator } from './Services';
import http = require('http');

const port = process.env.port || 1337

http.createServer(function (req, res) {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('Hello World\n');
}).listen(port);