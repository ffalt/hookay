import {Injectable} from '@angular/core';
import {Socket} from 'ngx-socket-io';
import {getBaseLocation} from './basepath.func';

@Injectable()
export class HookaySocket extends Socket {

	constructor() {
		super({
			url: '/', options: {
				path: (getBaseLocation() !== '/' ? getBaseLocation() : '') + '/socket',
				reconnectionAttempts: 10,
				autoConnect: false
			}
		});
	}

}
