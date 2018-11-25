import {EmitType, PublishActionOptions} from 'deplokay';
import {Task, TaskDetailInfo, TaskEmitFunction, TaskInfo} from './task';
import {Config, ConfigSite} from './config';

export class Engine {
	tasks: Array<Task> = [];

	constructor(private taskEmit: TaskEmitFunction) {

	}

	protected emit(task: Task, type: EmitType, state: string, details: string) {
		this.taskEmit(task, state);
		// console.log(task, type, state, details, nolog);
	}

	public async loadConfig(config: Config) {
		if (config.version === undefined) {
			config.version = 1;
		}
		if (config.version < 2) {
			console.error('DEPRECATION WARNING: You are using the old config format, please update your settings');
		}
		if (config.version > 2) {
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
						repository: (config.version === 2) ? site.repository : (<any>site).repro,
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
			} else {
				opts.build.jekyll = {};
			}
			const task = new Task(opts, this.emit.bind(this));
			await task.validate();
			result.push(task);
		}
		this.tasks = result;
	}

	public states(): Array<TaskInfo> {
		return this.tasks.map(task => task.info());
	}

	public details(name: string): TaskDetailInfo {
		const task = this.tasks.find(t => t.opts.id === name);
		return task ? task.details() : {name: 'unknown', state: 'unknown', type: EmitType.ERROR, logs: []};
	}

	public start(name: string, payload?: any) {
		const task = this.tasks.find(t => t.opts.id === name);
		if (task) {
			task.run();
		}
	}
}

