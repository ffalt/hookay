import { Task, TaskDetailInfo, TaskEmitFunction, TaskInfo } from './task';
import { Config } from './config';
export declare class Engine {
    private taskEmit;
    tasks: Array<Task>;
    constructor(taskEmit: TaskEmitFunction);
    private emit;
    loadConfig(config: Config): Promise<undefined>;
    states(): Array<TaskInfo>;
    details(name: string): TaskDetailInfo;
    start(name: string, payload?: any): void;
}
