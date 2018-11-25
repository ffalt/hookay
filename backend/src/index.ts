import {Engine} from './lib/engine';
import {Server} from './lib/server';
import {Task} from './lib/task';
import {Config} from './lib/config';
import program from 'commander';

const manifest = require('../package.json');
const config: Config = require('../config.json');

program
	.version(manifest.version)
	.option('-t, --test', 'Test the config and exit')
	.parse(process.argv);

async function run(): Promise<void> {
	let server: Server;
	const engine = new Engine((task: Task, state: string) => {
		server.notify({state: state, name: task.opts.id || ''});
	});
	await engine.loadConfig(config);
	server = new Server(config, engine, manifest.version);
	server.start();
}

async function test(): Promise<void> {
	const engine = new Engine((task: Task, state: string) => {
	});
	await engine.loadConfig(config);
	console.log('config format is valid');
}

if (program.test) {
	test().catch(e => {
		console.error(e);
	});
} else {
	run().catch(e => {
		console.error(e);
	});
}

