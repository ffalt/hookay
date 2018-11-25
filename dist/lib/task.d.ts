import { EmitFunction, EmitType, PublishActionBase, PublishActionOptions } from 'deplokay';
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
export declare type TaskEmitFunction = (task: Task, state: string) => void;
export declare class Task {
    opts: PublishActionOptions;
    private parentEmit;
    action: PublishActionBase<any>;
    isRunning: boolean;
    logMsgs: Array<TaskLogMsg>;
    constructor(opts: PublishActionOptions, parentEmit: EmitFunction);
    emit(task: any, type: EmitType, state: string, details: string): void;
    private getLastLog;
    info(): TaskInfo;
    details(): TaskDetailInfo;
    run(): void;
    validate(): Promise<void>;
}
