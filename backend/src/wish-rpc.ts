import { Application } from './application';
import { Server } from '@wishcore/wish-rpc';
import { RpcApp } from '@wishcore/wish-sdk';
import { btoh } from './utils';
import { createHash } from 'crypto';
import { Message } from './interfaces';
import { createReadStream, createWriteStream, renameSync, WriteStream } from 'fs';
import { Collection } from 'mongodb';

export interface ChatMessage {
    /** Time when message was created */
    time: number;
    /** Message */
    content: string;
    /** Wish user id of sender */
    from: string;
    /** File hashes */
    files: string[];
}

/**
 * Interface for peers
 *
 * Implements endpoints which are accessible from remote peers
 */
export class WishRpc {
    rpc: Server;
    app: RpcApp;

    constructor(application: Application) {
        this.rpc = application.wishRpcServer;
        this.app = application.app;
        const chatDb: Collection<ChatMessage> = application.db.jb.collection('chat');

        this.app.server.insertMethods({
            _signals: {},
            signals: (req, res, context) => {
                // keep open..
            },
            _send: {},
            send: async (req, res, context) => {
                const msg: Message = req.args[0];
                const signature = req.args[1];

                if (!signature) {
                    return res.error({ msg: 'Expecting signed message', code: 10 });
                }

                const hash = createHash('sha256').update(msg.content).digest();

                if (Buffer.compare(hash, signature.data)) {
                    // bogus signature, does not match with received data
                    return res.error({ msg: 'Hash does not match signature', code: 9 });
                }

                const verified = await this.app.wish.requestAsync('identity.verify', [signature]);

                if (verified.signatures[0].sign !== true) {
                    return res.error({ msg: 'Signature not valid or unknown signer', code: 8 });
                }

                const dbMessage: ChatMessage = {
                    content: msg.content,
                    files: msg.files,
                    from: btoh(context.peer.ruid),
                    time: msg.time,
                };

                if (msg.files && msg.files.length) {
                    for (const hash of msg.files) {
                        console.log('should download files context:', context);
                        const client = this.app.clients[context.peer.toUrl()];

                        if (!client) {
                            return console.log('Peer not here, cant get file.');
                        }

                        let meta;
                        let ws: WriteStream;
                        const tmpName = application.webHttp.pathFromHash(hash) + '.partial';

                        client.request('get', [hash], (err, data) => {
                            if (err) {
                                return console.log('error', err, data);
                            }

                            if (!meta) {
                                meta = data;

                                application.db.filesDb.insertOne({
                                    hash,
                                    type: meta.type,
                                    name: meta.name,
                                    size: meta.size
                                });

                                application.webHttp.ensureFilePathExists(hash);

                                ws = createWriteStream(tmpName);
                                return;
                            }

                            if (data === null) {
                                console.log('closing file, null received', );
                                ws.close();
                                renameSync(tmpName, application.webHttp.pathFromHash(hash));
                                return;
                            }

                            // console.log('got data', hash.substr(0, 6), data);

                            ws.write(data);
                        });
                    }
                }

                await chatDb.insertOne(dbMessage);

                console.log('dbMessage', dbMessage);

                application.webRpcServer.emit('signals', ['message', msg, context]);

                res.send();
            },
            _message: {},
            message: {
                _sync: {},
                sync: async (req, res, context) => {
                    const lastTimestamp: number = req.args[0];

                    // read all messages from db that are newer or equal to this timestamp
                    const messages = await chatDb.find({ time: { $gt: lastTimestamp } }).toArray();

                    res.send(messages);
                },
            },
            _get: {},
            get: async (req, res, context) => {
                const hash: string = req.args[0];

                const { _id, ...file } = await application.db.filesDb.findOne({ hash });

                await res.emit(file);

                const rs = createReadStream(application.webHttp.pathFromHash(hash));

                rs.on('readable', async () => {
                    let chunk;
                    // console.log('Stream is readable (new data received in buffer)');
                    // Use a loop to make sure we read all currently available data
                    while (null !== (chunk = rs.read(28 * 1024))) {
                        // console.log('sending chunk:', chunk);
                        try {
                            await res.emit(chunk);
                        } catch (error) {
                            let goodToGo = false;
                            while (!goodToGo) {
                                // console.log('error sending:', error);
                                await new Promise(resolve => setTimeout(resolve, 100));
                                try {
                                    await res.emit(chunk);
                                    goodToGo = true;
                                } catch (e) {}
                            }
                        }
                    }
                });

                rs.on('end', () => {
                    res.emit(null);
                });
            }
        });
    }
}
