import { Application } from './application';
import { Server } from '@wishcore/wish-rpc';
import { RpcApp } from '@wishcore/wish-sdk';
import { btoh } from './utils';
import { createHash } from 'crypto';

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
                const signature = req.args[1];

                if (!signature) {
                    return res.error({ msg: 'Expecting signed message', code: 10 });
                }

                const hash = createHash('sha256').update(msg).digest();

                if (Buffer.compare(hash, signature.data)) {
                    // bogus signature, does not match with received data
                    return res.error({ msg: 'Hash does not match signature', code: 9 });
                }

                const verified = await this.app.wish.requestAsync('identity.verify', [signature]);

                if (verified.signatures[0].sign !== true) {
                    return res.error({ msg: 'Signature not valid or unknown signer', code: 8 });
                }

                const dbMessage = {
                    content: msg,
                    from: btoh(context.peer.ruid),
                    time: Date.now(),
                };

                await docDb.insertOne(dbMessage);

                console.log('dbMessage', dbMessage);

                application.webRpcServer.emit('signals', ['message', msg, context]);

                res.send();
            },
        });
    }
}
