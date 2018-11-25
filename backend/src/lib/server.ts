import express from 'express';
import socketio from 'socket.io';
import http from 'http';
import bodyParser from 'body-parser';
import path from 'path';
import crypto from 'crypto';
import {Config} from './config';
import {Engine} from './engine';

export class Server {
	private readonly port: number;
	private server: http.Server;
	private app: express.Application;
	private io: socketio.Server;

	constructor(private config: Config, private engine: Engine, private version: string) {
		this.port = config.server.port || 3000;
		this.app = express();
		this.app.set('port', this.port);
		this.server = new http.Server(this.app);
		this.io = socketio(this.server, {path: '/socket'});
		this.app.use(bodyParser.urlencoded({extended: true, verify: this.verify}));
		this.app.use(bodyParser.json({verify: this.verify}));
		const webpath = path.resolve('dist/static');
		this.app.use(express.static(webpath));

		this.app.post(config.server.path || '/hooks/*', (req, res) => {
			//console.log('incoming request ' + JSON.stringify(req.params));
			engine.start(req.params[0], req.body);
			res.sendStatus(200);
		});

		this.io.on('connection', (socket: socketio.Socket) => {
			socket.emit('hello', {hello: this.version});

			const sendList = () => {
				socket.emit('list', {list: engine.states()});
			};

			socket.on('list', () => {
				sendList();
			});

			socket.on('details', (data: { name: string }) => {
				socket.emit('details', engine.details(data.name));
			});

			socket.on('rebuild', (data: { name: string }) => {
				engine.start(data.name);
				sendList();
			});
		});


	}

	notify(args: { state: string, name: string }) {
		this.io.emit('notify', args);
	}

	verify(req: express.Request, res: express.Response, buffer: Buffer) {
		let signature = req.headers['x-hub-signature'];
		if (!this.config.secret || !signature) {
			const err = new Error('No Signature :.(');
			(<any>err).status = 403;
			throw err;
		}
		signature = Array.isArray(signature) ? signature[0] : <string>signature;
		const hmac = crypto.createHmac('sha1', this.config.secret);
		const recieved_sig = signature.split('=')[1];
		const computed_sig = hmac.update(buffer).digest('hex');
		if (recieved_sig !== computed_sig) {
			const err = new Error('Invalid Signature :.(');
			(<any>err).status = 403;
			throw err;
		}
	}

	public start() {
		const httpserver = this.server.listen(this.port, this.config.server.host, () => {
			console.log('Listening on port http://' + this.config.server.host + ':' + this.port);
		});
	}
}
