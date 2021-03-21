import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import path from 'path';
import crypto from 'crypto';
import {Config} from './config';
import {Engine} from './engine';
import helmet from 'helmet';
import SocketIO from 'socket.io';
import {DefaultEventsMap} from 'socket.io/dist/typed-events';

export class Server {
	private readonly port: number;
	private server: http.Server;
	private app: express.Application;
	private io: any;

	constructor(private config: Config, private engine: Engine, private version: string) {
		this.port = config.server.port || 3000;
		this.app = express();
		this.app.set('port', this.port);
		this.server = new http.Server(this.app);
		this.io = new SocketIO.Server(this.server, {path: '/socket'});

		// post parsers
		this.app.use(bodyParser.urlencoded({extended: true, verify: this.verify.bind(this)}));
		this.app.use(bodyParser.json({verify: this.verify.bind(this)}));

		// hide express & stuff
		this.app.use(helmet());

		// static frontend
		const webpath = path.resolve('dist/static');
		this.app.use(express.static(webpath));

		// post function
		const listenpath = config.server.path || '/hooks/*';
		this.app.post(listenpath, (req, res) => {
			if (engine.start(req.params[0], req.body)) {
				res.sendStatus(200);
			} else {
				res.sendStatus(404);
			}
		});

		// frontend socket
		this.io.on('connection', (socket: SocketIO.Socket<DefaultEventsMap, DefaultEventsMap>) => {
			socket.emit('hello', {hello: this.version});

			socket.on('list', (): void => {
				socket.emit('list', {list: engine.states()});
			});

			socket.on('details', (data: { name: string }) => {
				socket.emit('details', engine.details(data.name));
			});

			socket.on('rebuild', (data: { name: string }) => {
				engine.start(data.name);
				socket.emit('list', {list: engine.states()});
			});
		});
	}

	verify(req: express.Request, res: express.Response, buffer: Buffer) {
		let signature = req.headers['x-hub-signature'];
		if (!this.config.secret || !signature) {
			const err = new Error('No Signature :.(');
			(err as any).status = 403;
			throw err;
		}
		signature = Array.isArray(signature) ? signature[0] : signature as string;
		const hmac = crypto.createHmac('sha1', this.config.secret);
		const recieved_sig = signature.split('=')[1];
		const computed_sig = hmac.update(buffer).digest('hex');
		if (recieved_sig !== computed_sig) {
			const err = new Error('Invalid Signature :.(');
			(err as any).status = 403;
			throw err;
		}
	}

	notify(args: { state: string; name: string }) {
		this.io.emit('notify', args);
	}

	start() {
		const httpserver = this.server.listen(this.port, this.config.server.host, () => {
			console.log('Listening on port http://' + this.config.server.host + ':' + this.port);
		});
	}
}
