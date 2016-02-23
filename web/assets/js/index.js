angular.module('StatusApp', ['ngSanitize'])
	.controller('StatusController', function ($scope, $location) {
		$scope.sites = [];
		$scope.sites_open = {};
		$scope.sites_details = {};
		var path = $location.path();
		var socket = io.connect('///', {path: path + '/socket.io'});
		socket.on('hello', function (data) {
			console.log('hello', data);
			socket.emit('list', {});
		});
		socket.on('list', function (data) {
			$scope.$apply(function () {
				$scope.sites = data.list;
			});
		});
		socket.on('details', function (data) {
			if (!data || !data.name) {
				return;
			}
			$scope.$apply(function () {
				$scope.sites_details[data.name] = data;
			});
		});
		socket.on('notify', function (data) {
			$scope.$apply(function () {
				$scope.sites.forEach(function (site) {
					if (site.name === data.name) {
						site.state = data.state;
					}
				});
				if ($scope.sites_open[data.name]) {
					console.log('req details');
					socket.emit('details', {name: data.name});
				}
			});
		});
		$scope.toggle = function (site) {
			$scope.sites_open[site.name] = !$scope.sites_open[site.name];
			if ($scope.sites_open[site.name]) {
				socket.emit('details', {name: site.name});
			}
		};
		$scope.rebuild = function (site) {
			socket.emit('rebuild', {name: site.name});
		};
	})
	.filter('logmsg', function () {
		return function (input) {
			if (!input) {
				return '';
			}
			if (typeof input !== 'string') {
				return JSON.stringify(input);
			}
			return input.toString().split('\n').filter(function (s) {
				return s.trim().length > 0;
			}).join('<br/>');
		};
	});

