"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const http_1 = __importDefault(require("http"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const helmet_1 = __importDefault(require("helmet"));
class Server {
    constructor(config, engine, version) {
        this.config = config;
        this.engine = engine;
        this.version = version;
        this.port = config.server.port || 3000;
        this.app = express_1.default();
        this.app.set('port', this.port);
        this.server = new http_1.default.Server(this.app);
        this.io = socket_io_1.default(this.server, { path: '/socket' });
        this.app.use(body_parser_1.default.urlencoded({ extended: true, verify: this.verify.bind(this) }));
        this.app.use(body_parser_1.default.json({ verify: this.verify.bind(this) }));
        this.app.use(helmet_1.default());
        const webpath = path_1.default.resolve('dist/static');
        this.app.use(express_1.default.static(webpath));
        const listenpath = config.server.path || '/hooks/*';
        this.app.post(listenpath, (req, res) => {
            if (engine.start(req.params[0], req.body)) {
                res.sendStatus(200);
            }
            else {
                res.sendStatus(404);
            }
        });
        this.io.on('connection', (socket) => {
            socket.emit('hello', { hello: this.version });
            const sendList = () => {
                socket.emit('list', { list: engine.states() });
            };
            socket.on('list', () => {
                sendList();
            });
            socket.on('details', (data) => {
                socket.emit('details', engine.details(data.name));
            });
            socket.on('rebuild', (data) => {
                engine.start(data.name);
                sendList();
            });
        });
    }
    verify(req, res, buffer) {
        let signature = req.headers['x-hub-signature'];
        if (!this.config.secret || !signature) {
            const err = new Error('No Signature :.(');
            err.status = 403;
            throw err;
        }
        signature = Array.isArray(signature) ? signature[0] : signature;
        const hmac = crypto_1.default.createHmac('sha1', this.config.secret);
        const recieved_sig = signature.split('=')[1];
        const computed_sig = hmac.update(buffer).digest('hex');
        if (recieved_sig !== computed_sig) {
            const err = new Error('Invalid Signature :.(');
            err.status = 403;
            throw err;
        }
    }
    notify(args) {
        this.io.emit('notify', args);
    }
    start() {
        const httpserver = this.server.listen(this.port, this.config.server.host, () => {
            console.log('Listening on port http://' + this.config.server.host + ':' + this.port);
        });
    }
}
exports.Server = Server;
//# sourceMappingURL=server.js.map