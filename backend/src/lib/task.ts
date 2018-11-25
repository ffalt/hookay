import {EmitFunction, EmitType, HugoPublishAction, JekyllPublishAction, PublishActionBase, PublishActionOptions} from 'deplokay';
import {CopyPublishAction} from 'deplokay/dist/lib/action/copy-git-publish';

export interface TaskLogMsg {
	state: string;
	details: string;
	date: number;
	type: EmitType;
}

export interface TaskInfo {
	name: string;
	state: string;
	type: EmitType;
}

export interface TaskDetailInfo extends TaskInfo {
	logs: Array<TaskLogMsg>;
}

export type TaskEmitFunction = (task: Task, state: string) => void;

export class Task {
	action: PublishActionBase<any>;
	isRunning: boolean = false;
	logMsgs: Array<TaskLogMsg> = [];

	constructor(public opts: PublishActionOptions, private parentEmit: EmitFunction) {
		if (opts.build.hugo) {
			this.action = new HugoPublishAction(opts, this, this.emit.bind(this));
		} else if (opts.build.copy) {
			this.action = new CopyPublishAction(opts, this, this.emit.bind(this));
		} else {
			this.action = new JekyllPublishAction(opts, this, this.emit.bind(this));
		}
	}

	emit(task: any, type: EmitType, state: string, details: string) {
		if (type === EmitType.LOG) {
			const last = this.getLastLog();
			last.details += (last.details.length ? '\n' : '') + details;
		} else {
			this.logMsgs.push({date: Date.now(), state, details, type});
			this.parentEmit(this, type, state, details);
		}
	}

	private getLastLog(): TaskLogMsg {
		let last = this.logMsgs[this.logMsgs.length - 1];
		if (!last) {
			last = {state: 'idle', type: EmitType.DONE, details: '', date: Date.now()};
		}
		return last;
	}

	info(): TaskInfo {
		const last = this.getLastLog();
		return {name: this.opts.id || '', state: last.state, type: last.type};
	}

	details(): TaskDetailInfo {
		const result = <TaskDetailInfo>this.info();
		result.logs = this.logMsgs;
		return result;
	}

	run() {
		if (this.isRunning) {
			return;
		}
		this.logMsgs = [];
		this.isRunning = true;
		this.action.run().then(() => {
			this.isRunning = false;
		}).catch(e => {
			this.isRunning = false;
			this.emit(this, EmitType.ERROR, 'error', e.toString());
		});
	}

	async validate() {
		await this.action.validateOptions();
	}
}
