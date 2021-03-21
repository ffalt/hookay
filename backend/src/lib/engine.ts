import {EmitType, PublishActionOptions} from 'deplokay';
import {Task, TaskDetailInfo, TaskEmitFunction, TaskInfo} from './task';
import {Config} from './config';

export class Engine {
	tasks: Array<Task> = [];

	constructor(private taskEmit: TaskEmitFunction) {
	}

	async loadConfig(config: Config) {
		let version = 1;
		if (config.version !== undefined) {
			version = config.version;
		}
		if (version < 2) {
			console.error('DEPRECATION WARNING: You are using the old config format, please update your settings');
		}
		if (version > 2) {
			return Promise.reject('Unknown config version ' + config.version);
		}
		const result = [];
		for (const site of config.sites) {
			if (!site.name) {
				return Promise.reject('Missing site url name for config ' + JSON.stringify(site));
			}
			console.log('Reading Config:', site.name);
			const opts: PublishActionOptions = {
				id: site.name,
				source: {
					remote: {
						checkout_path: site.build_path,
						branch: site.branch,
						repository: site.repository || (site as any).repro,
					}
				},
				build: {},
				publish: {
					folder: {
						path: site.publish_path
					}
				},
				env: site.env
			};
			if (site.build === 'hugo') {
				if (!site.hugo) {
					return Promise.reject('Missing hugo version settings');
				}
				opts.build.hugo = {
					extended: site.hugo.extended,
					version: site.hugo.version
				};
			} else if (site.build === 'copy') {
				opts.build.copy = {};
			} else if (site.build === 'jekyll') {
				opts.build.jekyll = {};
			} else if (config.version < 2) {
				opts.build.jekyll = {};
			} else {
				return Promise.reject('Missing build mode settings');
			}
			const task = new Task(opts, async (t, type, state, details) => this.emit(t, type, state, details));
			await task.validate();
			result.push(task);
		}
		this.tasks = result;
	}

	states(): Array<TaskInfo> {
		return this.tasks.map(task => task.info());
	}

	details(name: string): TaskDetailInfo {
		const task = this.tasks.find(t => t.opts.id === name);
		return task ? task.details() : {name: 'unknown', state: 'unknown', type: EmitType.ERROR, logs: []};
	}

	start(name: string, payload?: any): boolean {
		const task = this.tasks.find(t => t.opts.id === name);
		if (task) {
			if (payload && task.opts.source && task.opts.source.remote) {
				let branch = task.opts.source.remote.branch;
				if (payload.ref) {
					branch = payload.ref.replace('refs/heads/', '');
				}
				if (task.opts.source.remote.branch !== branch) {
					console.log((new Date()).toISOString(), task.opts.id, 'ignoring hook call for not configured branch:', branch);
					return true;
				}
			}
			console.log((new Date()).toISOString(), task.opts.id, (payload ? 'hook' : 'rebuild') + ' call, executing task');
			task.run();
			return true;
		}
		return false;
	}

	private emit(task: Task, type: EmitType, state: string, details: string) {
		this.taskEmit(task, state);
		// console.log(task, type, state, details, nolog);
	}
}

