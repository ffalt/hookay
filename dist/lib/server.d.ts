/// <reference types="node" />
import express from 'express';
import { Config } from './config';
import { Engine } from './engine';
export declare class Server {
    private config;
    private engine;
    private version;
    private readonly port;
    private server;
    private app;
    private io;
    constructor(config: Config, engine: Engine, version: string);
    notify(args: {
        state: string;
        name: string;
    }): void;
    verify(req: express.Request, res: express.Response, buffer: Buffer): void;
    start(): void;
}
