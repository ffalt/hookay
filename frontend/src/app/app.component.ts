import {Component} from '@angular/core';
import {EmitType, SocketService, TaskInfo, TaskInfoNode} from './socket.service';

@Component({
	selector: 'app-root',
	templateUrl: 'app.component.html',
	styleUrls: ['app.component.scss']
})
export class AppComponent {
	version: string | undefined;
	nodes: Array<TaskInfoNode> = [];

	constructor(private socketService: SocketService) {
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
						node = {task, open: false, isRunning: false, isError: false, isDone: false};
					}
					this.updateNode(node, task);
					return node;
				});
			});
		this.socketService.getDetails()
			.subscribe(data => {
				let node = this.nodes.find(n => n.task.name === data.name);
				if (!node) {
					this.socketService.requestList();
				} else {
					node.details = data;
					this.updateNode(node, data);
				}
			});
		this.socketService.getNotfiy()
			.subscribe(data => {
				let node = this.nodes.find(n => n.task.name === data.name);
				if (!node) {
					this.socketService.requestList();
				} else {
					console.log('data', data);
					node.task = data;
					this.updateNode(node, data);
					if (node.open) {
						this.socketService.requestDetails(data.name);
					}
				}
			});
	}
}
