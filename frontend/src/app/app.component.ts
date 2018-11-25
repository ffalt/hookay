import {Component, HostListener, OnInit} from '@angular/core';
import {EmitType, SocketService, TaskInfo, TaskInfoNode} from './socket.service';

@Component({
	selector: 'app-root',
	templateUrl: 'app.component.html',
	styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
	version: string | undefined;
	nodes: Array<TaskInfoNode> = [];

	constructor(public socketService: SocketService) {
	}

	@HostListener('window:focus', ['$event'])
	onFocus(event: any): void {
		this.socketService.connect();
	}

	@HostListener('window:blur', ['$event'])
	onBlur(event: any): void {
		this.socketService.disconnect();
		this.nodes.forEach(node => {
			if (node.open) {
				this.socketService.requestDetails(node.task.name);
			}
		})
	}

	rebuild(node: TaskInfoNode) {
		this.socketService.requestRebuild(node.task.name);
	}

	toggle(node: TaskInfoNode) {
		node.open = !node.open;
		if (node.open) {
			this.socketService.requestDetails(node.task.name);
		}
	}

	updateNode(node: TaskInfoNode, task: TaskInfo) {
		node.isError = task.type === EmitType.ERROR;
		node.isDone = task.type === EmitType.DONE;
		node.isRunning = task.type === EmitType.OPERATION || task.type === EmitType.SUCCESS;
		node.isIdle = (node.isError || node.isDone) && !node.isRunning;
		if (node.details) {
			for (const log of node.details.logs) {
				if (log.details) {
					log.detailsSL = log.details.split('\n');
				}
			}
		}
	}

	ngOnInit() {
		this.socketService.getVersion()
			.subscribe(version => {
				this.version = version;
				this.socketService.requestList();
			});
		this.socketService.getList()
			.subscribe(data => {
				this.nodes = data.list.map(task => {
					let node = this.nodes.find(n => n.task.name === task.name);
					if (node) {
						node.task = task;
					} else {
						node = {task, open: false, isRunning: false, isError: false, isIdle: true, isDone: false};
					}
					this.updateNode(node, task);
					return node;
				});
			});
		this.socketService.getDetails()
			.subscribe(data => {
				const node = this.nodes.find(n => n.task.name === data.name);
				if (!node) {
					this.socketService.requestList();
				} else {
					node.details = data;
					this.updateNode(node, data);
				}
			});
		this.socketService.getNotfiy()
			.subscribe(data => {
				const node = this.nodes.find(n => n.task.name === data.name);
				if (!node) {
					this.socketService.requestList();
				} else {
					node.task = data;
					this.updateNode(node, data);
					if (node.open) {
						this.socketService.requestDetails(data.name);
					}
				}
			});
		this.socketService.connect();
	}
}
