import { Collection } from 'mongodb';
import { Peer, RpcApp } from '@wishcore/wish-sdk';
import { Client, Server } from '@wishcore/wish-rpc';

export class Wish {
    app: RpcApp;
    peerDb: Collection;

    constructor(db: any, wish: Server, web: Server, opts?: { port: number }) {
        this.peerDb = db.jb.collection('peer');

        this.app = new RpcApp({
            name: process.env.SID || "Wha'Dapp (v0.12.3) " + (opts.port || ''),
            corePort: opts.port || parseInt(process.env.APP_PORT, 10) || 9094,
            protocols: {
                example: {
                    online: async (peer: Peer, client: Client) => {
                        this.online(peer);
                        web.emit('signals', ['peer.online', peer]);
                    },
                    offline: (peer: Peer) => {
                        web.emit('signals', ['peer.offline', peer]);
                    },
                }
            }
        });
    }

    private online(peer: Peer) {
        const url = peer.toUrl();
        this.peerDb.updateOne({ url }, { $set: { url, time: Date.now() } }, { upsert: true });
    }
}
