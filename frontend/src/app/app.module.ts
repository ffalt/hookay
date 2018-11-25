import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {SocketIoModule} from 'ngx-socket-io';
import {SocketService} from './socket.service';
import {APP_BASE_HREF} from '@angular/common';
import {HookaySocket} from './socket.class';
import {getBaseLocation} from './basepath.func';

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		SocketIoModule
	],
	providers: [
		HookaySocket,
		SocketService,
		{
			provide: APP_BASE_HREF,
			useFactory: getBaseLocation
		}],
	bootstrap: [AppComponent]
})
export class AppModule {
}
