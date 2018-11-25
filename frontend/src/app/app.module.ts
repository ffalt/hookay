import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {SocketIoConfig, SocketIoModule} from 'ngx-socket-io';
import {SocketService} from './socket.service';
import {APP_BASE_HREF, Location} from '@angular/common';

const apipath = window.location ? window.location.pathname : '';
const config: SocketIoConfig = {url: apipath, options: {path: '/socket'}};

export function getBaseLocation() {
	let paths: string[] = location.pathname.split('/').splice(1, 1);
	let basePath: string = (paths && paths[0]) || ''; // Default: nothing
	return '/' + basePath;
}

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		SocketIoModule.forRoot(config)
	],
	providers: [
		SocketService,
		{
			provide: APP_BASE_HREF,
			useFactory: getBaseLocation
		}],
	bootstrap: [AppComponent]
})
export class AppModule {
}
