import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import {Socket} from 'ngx-socket-io';

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
	isDone: boolean;
	isError: boolean;
}


@Injectable({
	providedIn: 'root'
})
export class SocketService {

	constructor(private socket: Socket) {
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
