import { Database } from './database';
import { Server as WebSocketServer } from 'ws';
import { Wish } from './wish';
import { Server } from '@wishcore/wish-rpc';
import { WebRpc } from './web-rpc';
import { WishRpc } from './wish-rpc';
import { WebHttp } from './web-http';
import { RpcApp } from '@wishcore/wish-sdk';
import { WebSocketRpcWrapper } from './utils';

interface ApplicationOpts {
    /** Environment name */
    name?: string;
    db?: string;
    port?: number;
    wish?: number;
}

export class Application {
    opts: ApplicationOpts;
    wss: WebSocketServer;
    app: RpcApp;
    webRpc: WebRpc;
    wishRpc: WishRpc;
    webHttp: WebHttp;
    webRpcServer: Server;
    wishRpcServer: Server;
    wish: Wish;
    db: Database;

    private constructor() {}

    static async create(opts: ApplicationOpts = {}) {
        const instance = new Application();

        instance.opts = opts;

        instance.db = await Database.create(opts.db || 'whadapp');
        instance.webRpcServer = new Server();
        instance.wishRpcServer = new Server();
        instance.webHttp = new WebHttp(instance, opts.port || process.env.PORT || 8080);
        instance.wss = new WebSocketServer({ server: instance.webHttp.http });

        const websocketWrapper = new WebSocketRpcWrapper(instance.webRpcServer, instance.wss);

        instance.wish = new Wish(instance.db, instance.wishRpcServer, instance.webRpcServer, { port: opts.wish });
        instance.app = instance.wish.app;

        instance.webRpc = new WebRpc(instance);
        instance.wishRpc = new WishRpc(instance);

        return instance;
    }
}
