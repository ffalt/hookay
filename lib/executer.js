var fs = require('fs');
var path = require('path');
var async = require('async');
var exec = require('child_process').exec;
var simpleGit = require('simple-git');
var fse = require('fs.extra');

var Tasker = function (site, notify) {
	var me = this;
	me.name = site.name;
	me.tasks = [];

	var emit = function (state, task, details, nolog) {
		//console.log(state, JSON.stringify(task));
		task.state = state;
		if (!nolog) {
			task.logs.push({state: state, details: details, date: new Date()});
		}
		notify({task: task, site: site, state: state, details: details});
	};

	me.runTask = function (task, cb) {
		me.tasks.push(task);
		emit('start', task);
		async.series([
			function (then) {
				getGit(task, then);
			},
			function (then) {
				runJekyll(task, then);
			},
			function (then) {
				publishSite(task, then);
			}
		], function (err, results) {
			cb();
		});
	};

	var queue = async.queue(me.runTask, 1);

	var getGit = function (task, cb) {
		var branch = site.branch;
		if (task.data.ref) {
			branch = task.data.ref.replace('refs/heads/', '');
		}
		if (site.branch && site.branch !== branch) {
			var err = 'Invalid branch config ' + site.branch + ' !== ' + branch;
			emit('error', task, err);
			return cb(err);
		}
		var git_dir = path.resolve(site.build_path);
		var git = simpleGit(git_dir);
		fs.exists(path.resolve(git_dir, '.git'), function (exists) {
			if (exists) {
				if (err && (err.toString().indexOf('already exists.') < 0)) {
					emit('error', task, err);
					return cb(err);
				}
				emit('updating', task, {path: git_dir, repro: site.repro});
				git.pull('origin', branch, function (err, result) {
					if (err) {
						emit('error', task, err);
						return cb(err);
					}
					emit('updated', task, result);
					cb();
				});
			} else {
				fse.mkdirp(git_dir, function (err) {
					if (!err || (err && err.code === 'EEXIST')) {
						emit('cloning', task, {path: git_dir, repro: site.repro});
						git.clone(site.repro, git_dir, function (err) {
							if (err) {
								emit('error', task, err);
								return cb(err);
							}
							emit('checkout', task, {branch: branch, repro: site.repro});
							git.checkoutBranch(branch, 'origin/' + branch, function (err) {
								if (err && (err.toString().indexOf('already exists.') < 0)) {
									emit('error', task, err);
									return cb(err);
								}
								emit('updating', task, {branch: branch, repro: site.repro});
								git.pull('origin', branch, function (err, result) {
									if (err) {
										emit('error', task, err);
										return cb(err);
									}
									emit('updated', task, result);
									cb(err);
								});
							});
						});
					} else {
						emit('error', task, 'Could not make Build Directory');
						cb(err || 'cannot make dir');
					}
				});
			}
		});
	};

	var buildJekyll = function (task, cb) {
		var jekyll_dir = path.resolve(site.build_path);
		var dest_dir = path.resolve(site.build_path, '_site');
		emit('building', task, {path: jekyll_dir, dest: dest_dir});
		var params = '';
		if (!fs.existsSync(path.resolve(jekyll_dir, 'Gemfile'))) {
			params = 'BUNDLE_GEMFILE=' + path.resolve(__dirname, '..', 'resource', 'Gemfile') + ' ';
		}
		exec(params + 'bundle exec jekyll build -d ' + dest_dir, {cwd: jekyll_dir}, function (err, stdout, stderr) {
			var result = '';
			if (stdout && stdout.toString().length > 0) {
				result += stdout.toString();
			}
			if (stderr && stderr.toString().length > 0) {
				result += stderr.toString();
			}
			result = result.replace(/\[31m /g, '').replace(/\[0m/g, '');
			if (
				(result.toLowerCase().indexOf('error') >= 0) ||
				(result.indexOf('command not found') >= 0) ||
				(result.indexOf('Could not locate Gemfile') >= 0) ||
				(result.indexOf('Bundler::GemNotFound') >= 0)
			) {
				if (result.indexOf('Generating... \n') >= 0) {
					result = result.split('Generating... \n')[1];
					if (result.indexOf('done.') >= 0) {
						result = result.split('done.')[0];
					}
				}
				return cb(result);
			}
			if (result.indexOf('Generating... \n') >= 0) {
				result = result.split('Generating... \n')[1];
				if (result.indexOf('done.') >= 0) {
					result = result.split('done.')[0];
				}
			}
			cb(null, result);
		});
	};

	var runJekyll = function (task, cb) {
		buildJekyll(task, function (err, result) {
				if (!err) {
					emit('build', task, result);
					return cb();
				} else if ((err.indexOf('require') >= 0) ||
					(err.indexOf('missing gem executables') >= 0) ||
					(err.indexOf('Could not locate Gemfile') >= 0) ||
					(err.indexOf('GemNotFound') >= 0)
				) {
					var params = '';
					var jekyll_dir = path.resolve(site.build_path);
					if (!fs.existsSync(path.resolve(jekyll_dir, 'Gemfile'))) {
						params = '--gemfile=' + path.resolve(__dirname, '..', 'resource', 'Gemfile') + ' ';
					}
					emit('installing', task, {path: jekyll_dir});
					var cmd = 'bundle install ' + params + '--path ' + jekyll_dir + '/.gem';
					return exec(cmd, {cwd: jekyll_dir}, function (err, stdout, stderr) {
							if (stderr && stderr.toString().length > 0) {
								err = stderr.toString();
								emit('error', task, err);
								return cb(err);
							}
							var result = stdout.toString();
							if (result.toLowerCase().indexOf('error') >= 0) {
								emit('error', task, result);
								return cb(result);
							}
							emit('installed', task, result);

							buildJekyll(task, function (err, result) {
								if (!err)
									emit('build', task, result);
								else
									emit('error', task, err);
								return cb(err);
							});
						}
					);
				}
				else {
					emit('error', task, err);
					return cb(err);
				}
			}
		);
	};

	var publishSite = function (task, cb) {
		var src_dir = path.resolve(site.build_path, '_site');
		var tmp_dest_dir = path.resolve(site.publish_path + '_backup');
		var dest_dir = path.resolve(site.publish_path);

		var backupPublishFolder = function (then) {
			fse.exists(dest_dir, function (exists) {
				if (!exists) return then();
				emit('backing up', task);
				fse.move(dest_dir, tmp_dest_dir, function (err) {
					if (!err || (err && err.code === 'ENOENT')) {
						then();
					} else {
						emit('error', task, 'Failed backup publish folder');
						then(err);
					}
				});
			});
		};

		var removeBackupFolder = function (then) {
			fse.exists(tmp_dest_dir, function (exists) {
				if (!exists) return then();
				emit('removing backup', task);
				fse.rmrf(tmp_dest_dir, function (err) {
					if (!err || (err && err.code === 'ENOENT')) {
						then();
					} else {
						emit('error', task, 'Failed remove backup folder');
						then(err);
					}
				});
			});
		};

		var restorePublishFolder = function (then) {
			fse.exists(tmp_dest_dir, function (exists) {
				if (!exists) return then();
				emit('restoring backup', task);
				fse.move(tmp_dest_dir, dest_dir, function (err) {
					if (!err || (err && err.code === 'ENOENT')) {
						then();
					} else {
						emit('error', task, 'Failed restoring backup folder');
						then(err);
					}
				});
			});
		};

		var movePublishFolder = function (then) {
			emit('publishing', task);
			fse.move(src_dir, dest_dir, function (err) {
				if (!err) {
					then();
				} else {
					emit('error', task, 'Failed moving publish folder');
					then(err);
				}
			});
		};

		backupPublishFolder(function (err) {
			if (err) return cb(err);
			movePublishFolder(function (err) {
				if (err) {
					restorePublishFolder(function (err2) {
						cb(err || err2);
					});
				} else {
					removeBackupFolder(function (err2) {
						emit('published', task);
						cb(err2);
					});
				}
			});
		});
	};

	me.state = function () {
		if (me.tasks.length) return me.tasks[me.tasks.length - 1].state;
		return 'idle';
	};

	me.details = function () {
		return me.tasks[me.tasks.length - 1];
	};

	me.exec = function (task) {
		var branch = site.branch;
		if (task.data.ref) {
			branch = task.data.ref.replace('refs/heads/', '');
		}
		if (site.branch && site.branch !== branch) {
			//ignore notifications for not configured branches
			return;
		}
		task.logs = [];
		emit('queued', task, null, true);
		queue.push(task);
	};
};

var Executer = function (config, notify) {
	var me = this;

	me.tasks = [];
	config.sites.forEach(function (site) {
		me.tasks.push(new Tasker(site, notify));
	});

	me.states = function () {
		var result = {};
		me.tasks.forEach(function (tasker) {
			result[tasker.name] = tasker.state();
		});
		return result;
	};

	me.details = function (name) {
		var tasker = me.tasks.filter(function (t) {
			return name === t.name;
		})[0];
		if (tasker) {
			return tasker.details();
		}
		return null;
	};

	me.exec = function (task) {
		var tasker = me.tasks.filter(function (t) {
			return t.name === task.name;
		})[0];
		if (tasker) tasker.exec(task);
	};
};

module.exports = Executer;
