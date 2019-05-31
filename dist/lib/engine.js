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
const task_1 = require("./task");
class Engine {
    constructor(taskEmit) {
        this.taskEmit = taskEmit;
        this.tasks = [];
    }
    emit(task, type, state, details) {
        this.taskEmit(task, state);
    }
    loadConfig(config) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const opts = {
                    id: site.name,
                    source: {
                        remote: {
                            checkout_path: site.build_path,
                            branch: site.branch,
                            repository: site.repository || site.repro,
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
                }
                else if (site.build === 'copy') {
                    opts.build.copy = {};
                }
                else if (site.build === 'jekyll') {
                    opts.build.jekyll = {};
                }
                else if (config.version < 2) {
                    opts.build.jekyll = {};
                }
                else {
                    return Promise.reject('Missing build mode settings');
                }
                const task = new task_1.Task(opts, (task, type, state, details) => __awaiter(this, void 0, void 0, function* () {
                    return this.emit(task, type, state, details);
                }));
                yield task.validate();
                result.push(task);
            }
            this.tasks = result;
        });
    }
    states() {
        return this.tasks.map(task => task.info());
    }
    details(name) {
        const task = this.tasks.find(t => t.opts.id === name);
        return task ? task.details() : { name: 'unknown', state: 'unknown', type: deplokay_1.EmitType.ERROR, logs: [] };
    }
    start(name, payload) {
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
}
exports.Engine = Engine;
//# sourceMappingURL=engine.js.map