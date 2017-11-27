#!/usr/bin/env node
"use strict";

var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var parseurl = require('parseurl');
var crypto = require('crypto');
var socketio = require('socket.io');
var Executer = require('./lib/executer');

var config = require('./config.json');

var app = express();
var server = http.Server(app);
var io = socketio.listen(server);

var executer = new Executer(config, function (o) {
	io.emit('notify', {state: o.state, name: o.task.name});
});

var verify = function (req, res, buffer) {
	if (!config.secret || !req.headers['x-hub-signature']) return;
	var hmac = crypto.createHmac('sha1', config.secret);
	var recieved_sig = req.headers['x-hub-signature'].split('=')[1];
	var computed_sig = hmac.update(buffer).digest('hex');
	if (recieved_sig !== computed_sig) {
		var err = new Error('Invalid Signature :.(');
		err.status = 403;
		throw err;
	}
};

app.use(bodyParser.urlencoded({extended: true, verify: verify}));
app.use(bodyParser.json({verify: verify}));

app.use('/assets/vendor/*', function (req, res, next) {
	var pathname = (parseurl.original(req) || {}).pathname || '';
	var pathnames = pathname.split('/');
	if (['angular', 'angular-sanitize', 'font-awesome', 'typeface-fira-sans', 'typeface.fira-mono'].indexOf(pathnames[3]) >= 0) {
		next();
	} else {
		res.status(403).send('<h1>403 Forbidden</h1>');
	}
});
app.use('/assets/vendor/', express.static('node_modules'));
app.use(express.static('web'));

app.post('/hooks/*', function (req, res) {
	//console.log('incoming request ' + JSON.stringify(req.params));
	executer.exec({
		data: req.body,
		name: req.params[0]
	});
	res.sendStatus(200);
});

io.on('connection', function (socket) {
	socket.emit('hello', {hello: 'you'});

	var sendList = function () {
		var states = executer.states();
		var sites = config.sites.map(function (site) {
			return {name: site.name, state: states[site.name] || 'invalid'};
		});
		socket.emit('list', {list: sites});
	};

	socket.on('list', function (data) {
		sendList();
	});

	socket.on('details', function (data) {
		socket.emit('details', executer.details(data.name));
	});

	socket.on('rebuild', function (data) {
		var site = config.sites.filter(function (s) {
			return s.name === data.name;
		})[0];
		if (site) {
			executer.exec({
				data: {},
				name: site.name
			});
			sendList();
		}
	});
});

server.listen(config.server.port, config.server.host, function () {
	console.log('Listening on port http://' + config.server.host + ':' + config.server.port);
});

