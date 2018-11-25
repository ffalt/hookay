import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import {HookaySocket} from './socket.class';

export enum EmitType {
	ERROR = 0,
	OPERATION = 1,
	LOG = 2,
	SUCCESS = 3,
	DONE = 4,
	FINISH = 5
}

export interface TaskLogMsg {
	state: string;
	details: string;
	date: number;
	type: EmitType;
	detailsSL?: Array<string>;
}

export interface TaskInfo {
	name: string;
	state: string;
	type: EmitType;
}

export interface TaskDetailInfo extends TaskInfo {
	logs: Array<TaskLogMsg>;
}

export interface TaskInfoNode {
	task: TaskInfo;
	details?: TaskDetailInfo;
	open: boolean;
	isRunning: boolean;
	isIdle: boolean;
	isDone: boolean;
	isError: boolean;
}


@Injectable({
	providedIn: 'root'
})
export class SocketService {
	connected: boolean = false;
	connecting: boolean = false;
	reconnectNr: number = 0;

	constructor(private socket: HookaySocket) {

		socket.on('connect', () => {
			this.connecting = false;
			this.connected = true;
		});
		socket.on('disconnect', () => {
			this.connected = false;
			this.connecting = false;
		});
		socket.on('reconnecting', (attemptNumber) => {
			this.connecting = true;
			this.connected = false;
			this.reconnectNr = attemptNumber;
		});
		socket.on('reconnect_failed', (error) => {
			this.connecting = false;
			this.connected = false;
		});
	}

	connect() {
		if (!this.connecting && !this.connected) {
			this.reconnectNr = 0;
			this.connecting = true;
			this.socket.connect();
		}
	}

	disconnect() {
		this.reconnectNr = 0;
		this.connecting = false;
		this.connected = false;
		this.socket.disconnect();
	}

	getVersion() {
		return this.socket
			.fromEvent<{ hello: string }>('hello')
			.pipe(
				map(data => data.hello)
			);
	}

	requestList() {
		this.socket.emit('list', '');
	}

	getList() {
		return this.socket.fromEvent<{ list: Array<TaskInfo> }>('list');
	}

	getNotfiy() {
		return this.socket.fromEvent<TaskInfo>('notify');
	}

	getDetails() {
		return this.socket.fromEvent<TaskDetailInfo>('details');
	}

	sendMessage(msg: string) {
		this.socket.emit('msg', msg);
	}

	requestDetails(name: string) {
		this.socket.emit('details', {name});
	}

	requestRebuild(name: string) {
		this.socket.emit('rebuild', {name});
	}
}
