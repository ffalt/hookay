"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const engine_1 = require("./lib/engine");
const server_1 = require("./lib/server");
const commander_1 = __importDefault(require("commander"));
const manifest = require('../package.json');
const config = require('../config.json');
commander_1.default
    .version(manifest.version)
    .option('-t, --test', 'Test the config and exit')
    .parse(process.argv);
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let server;
        const engine = new engine_1.Engine((task, state) => {
            server.notify({ state: state, name: task.opts.id || '' });
        });
        yield engine.loadConfig(config);
        server = new server_1.Server(config, engine, manifest.version);
        server.start();
    });
}
function test() {
    return __awaiter(this, void 0, void 0, function* () {
        const engine = new engine_1.Engine((task, state) => {
        });
        yield engine.loadConfig(config);
        console.log('config format is valid');
    });
}
if (commander_1.default.test) {
    test().catch(e => {
        console.error(e);
    });
}
else {
    run().catch(e => {
        console.error(e);
    });
}
//# sourceMappingURL=index.js.map