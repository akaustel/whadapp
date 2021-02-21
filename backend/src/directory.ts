import { Client } from '@wishcore/wish-rpc';
import { App } from '@wishcore/wish-sdk';
import WebSocket = require('ws');

const BSON = new (require('bson-buffer'))();

export class Directory {
    client: Client;
    socket: WebSocket;

    constructor(private app: App, url: string) {
        // Connect to Directory service for finding friends
        this.socket = new WebSocket(url, { rejectUnauthorized: false });

        this.client = new Client(message => this.socket.send(BSON.serialize(message)));

        this.socket.on('error', (error) => {
            console.log('Could not connect to directory.', error);
        });

        this.socket.on('open', () => {
            // Connected to directory
        });

        this.socket.on('message', (message) => {
            if (!Buffer.isBuffer(message)) { return; }

            this.client.messageReceived(BSON.deserialize(message));
        });
    }

    async publish(uid: string | Buffer, directoryData?) {
        uid = Buffer.isBuffer(uid) ? uid : Buffer.from(uid, 'hex');

        const cert = await this.app.requestAsync('identity.export', [uid]);

        if (directoryData) {
            const directoryEntry = BSON.deserialize(cert.data);
            directoryEntry.meta = directoryData;
            cert.data = BSON.serialize(directoryEntry);

            // console.log('Would publish this:', directoryEntry);
        }

        const data = await this.app.requestAsync('identity.sign', [uid, cert]);

        const timestamp = await this.client.request('time', []);

        const claim = BSON.serialize({ uid, timestamp });

        return this.client.request('directory.publish', [data, claim /*, pow */]);
    }

    /** Find alias by string and uid by Buffer */
    async find(search: string | Buffer) {
        return await this.client.requestAsync('directory.find', [search]);
    }

    api() {
        return {
            _time: {},
            time: async (req, res, context) => {
                const time = await this.client.requestAsync('time', []);

                res.send(time);
            },
            _publish: {},
            publish: async (req, res, context) => {
                const uid = req.args[0];
                const directoryData = req.args[1];

                res.send(await this.publish(uid, directoryData));
            },
            _unpublish: {},
            unpublish: async (req, res, context) => {
                const uid = req.args[0];

                const timestamp = await this.client.requestAsync('time', []);

                const doc = {
                    data: BSON.serialize({ op: 'directory.unpublish', timestamp })
                };

                const data = this.app.requestAsync('identity.sign', [uid, doc]);

                const response = await this.client.requestAsync('directory.unpublish', [uid, data]);

                res.send();
            },
            _remove: {},
            remove: async (req, res, context) => {
                const id = req.args[0];

                const data = await this.client.requestAsync('directory.remove', [id]);

                res.send();
            },
            _find: {},
            find: async (req, res, context) => {
                const alias = req.args[0];

                res.send(await this.find(alias));
            },
            _friendRequest: {},
            friendRequest: async (req, res, context) => {
                const uid = req.args[0];
                const entry = req.args[1];

                res.send(await this.app.requestAsync('identity.friendRequest', [uid, entry.cert]));
            }
        };
    }
}
