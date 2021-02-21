import { Application } from './application';
import { Server } from '@wishcore/wish-rpc';
import { RpcApp } from '@wishcore/wish-sdk';
import { btoh } from './utils';

export class WishRpc {
    rpc: Server;
    app: RpcApp;

    constructor(application: Application) {
        this.rpc = application.wishRpcServer;
        this.app = application.app;
        const docDb = application.db.jb.collection('chat');

        this.app.server.insertMethods({
            _signals: {},
            signals: (req, res, context) => {
                // keep open..
            },
            _send: {},
            send: async (req, res, context) => {
                const msg = req.args[0];

                const dbMessage = {
                    content: msg,
                    from: btoh(context.peer.ruid),
                    time: Date.now(),
                };

                await docDb.insertOne(dbMessage);

                console.log('dbMessage', dbMessage);

                application.webRpcServer.emit('signals', ['message', msg, context]);
            },
        });
    }
}
