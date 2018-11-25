"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const deplokay_1 = require("deplokay");
class Task {
    constructor(opts, parentEmit) {
        this.opts = opts;
        this.parentEmit = parentEmit;
        this.isRunning = false;
        this.logMsgs = [];
        if (opts.build.hugo) {
            this.action = new deplokay_1.HugoPublishAction(opts, this, this.emit.bind(this));
        }
        else {
            this.action = new deplokay_1.JekyllPublishAction(opts, this, this.emit.bind(this));
        }
    }
    emit(task, type, state, details) {
        if (type === deplokay_1.EmitType.LOG) {
            const last = this.getLastLog();
            last.details += (last.details.length ? '\n' : '') + details;
        }
        else {
            this.logMsgs.push({ date: Date.now(), state, details, type });
            this.parentEmit(this, type, state, details);
        }
    }
    getLastLog() {
        let last = this.logMsgs[this.logMsgs.length - 1];
        if (!last) {
            last = { state: 'idle', type: deplokay_1.EmitType.DONE, details: '', date: Date.now() };
        }
        return last;
    }
    info() {
        const last = this.getLastLog();
        return { name: this.opts.id || '', state: last.state, type: last.type };
    }
    details() {
        const result = this.info();
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
            this.emit(this, deplokay_1.EmitType.ERROR, 'error', e.toString());
        });
    }
    validate() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.action.validateOptions();
        });
    }
}
exports.Task = Task;
//# sourceMappingURL=task.js.map