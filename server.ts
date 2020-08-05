import { Azure, Validator } from './Services';
import * as HttpServer from 'http';

const port = process.env.port || 1337

Azure.SetPrivateSecret();

HttpServer.createServer(function (req, res) {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('Hello World\n');
}).listen(port);