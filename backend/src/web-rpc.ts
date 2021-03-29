import { Application } from './application';
import { Collection } from 'mongodb';
import { Server } from '@wishcore/wish-rpc';
import { Peer, RpcApp } from '@wishcore/wish-sdk';
import { Directory } from './directory';
import { Message } from './interfaces';
import { createHash } from 'crypto';

/**
 * Interface from browser frontend
 *
 * Contains the rpc endpoints which can be called from the web ui
 */
export class WebRpc {
    rpc: Server;
    app: RpcApp;
    docDb: Collection;
    currentDb: Collection;

    constructor(application: Application) {
        this.rpc = application.webRpcServer;
        this.app = application.app;
        this.docDb = application.db.jb.collection('chat');

        this.rpc.insertMethods({
            _signals: {},
            signals: (req, res, context) => {
                // keep open..
            },
            _wish: {},
            wish: (req, res, context) => {
                const id = this.app.wish.requestBare(req.args[0], req.args[1], (msg) => {
                    try {
                        if (msg.sig) {
                            res.emit(msg);
                        } else {
                            res.send(msg);
                        }
                    } catch (e) {
                        console.log('Seems there is no one here anymore., canceling request', id);
                        this.app.wish.cancel(id);
                    }
                });
            },
            _send: {},
            send: async (req, res, context) => {
                const msg: Message = req.args[0];

                const dbMessage = {
                    ...msg,
                    time: Date.now()
                };

                const identities = await this.app.wish.requestAsync('identity.list', []);

                const identity = identities[0];

                const hash = createHash('sha256').update(msg.content).digest();

                const signature = await this.app.wish.requestAsync('identity.sign', [identity.uid, { data: hash }]);

                this.docDb.insertOne(dbMessage);

                Object.values(this.app.clients).forEach(async client => {
                    client.request('send', [msg, signature], () => {});
                });
            },
            _list: {},
            list: async (req, res, context) => {
                const list: Message[] = await this.docDb.find<Message>({}, { sort: { time: 1 } }).toArray();

                res.send(list);
            },
            _sendTo: {},
            sendTo: (req, res, context) => {
                const peer = Peer.from(req.args[0]);
                const msg = req.args[1];

                const client = this.app.clients[peer.toUrl()];

                if (!client) {
                    return res.error({ msg: 'Peer not here.', code: 13 });
                }

                client.request('send', [msg], () => {});
            },
            _peers: {},
            peers: (req, res, context) => {
                res.send(Object.values(this.app.wish.peers));
            }
        });

        const directory = new Directory(this.app.wish, 'wss://relay.wishtech.fi');

        this.rpc.insertMethods({
            _directory: {},
            directory: directory.api()
        });
    }
}
