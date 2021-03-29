import { Collection } from 'mongodb';
import { Peer, RpcApp } from '@wishcore/wish-sdk';
import { Client, Server } from '@wishcore/wish-rpc';
import { ChatMessage } from './wish-rpc';

export class Wish {
    app: RpcApp;
    peerDb: Collection;
    chatDb: Collection<ChatMessage>;

    constructor(db: any, wish: Server, web: Server, opts?: { port: number }) {
        this.peerDb = db.jb.collection('peer');
        this.chatDb = db.jb.collection('chat');

        this.app = new RpcApp({
            name: process.env.SID || "Wha'Dapp (v0.12.3) " + (opts.port || ''),
            corePort: opts.port || parseInt(process.env.APP_PORT, 10) || 9094,
            protocols: {
                example: {
                    online: async (peer: Peer, client: Client) => {
                        await this.online(peer, client);
                        web.emit('signals', ['peer.online', peer]);
                    },
                    offline: (peer: Peer) => {
                        web.emit('signals', ['peer.offline', peer]);
                    },
                }
            }
        });
    }

    private async online(peer: Peer, client: Client) {
        const url = peer.toUrl();

        const dbPeer = await this.peerDb.findOne({ url });

        let lastTimestamp = 0;

        if (dbPeer) {
            lastTimestamp = dbPeer.time;
        }

        // request messages from peer
        const messages = await client.requestAsync('message.sync', [lastTimestamp]);

        if (!messages.length) {
            return;
        }

        // save messages to db
        await this.chatDb.insertMany(messages);

        // save last received message time to db
        await this.peerDb.updateOne({ url }, { $set: { url, time: Date.now() } }, { upsert: true });
    }
}
