import { Client } from '@wishcore/wish-rpc';
import { Peer, RpcApp, WishCoreRunner, WishCoreRunnerOpts } from '@wishcore/wish-sdk';
import { createHash } from 'crypto';
import { RequestOptions } from 'http';
import { request } from 'https';
import { Directory } from '../src/directory';

const opts: WishCoreRunnerOpts = {
    appPort: 9099,
    nodePort: 60000,
    cwd: '/tmp'
};

(async () => {
    await WishCoreRunner.start(opts);

    console.log('up and running...');

    const cathy = new ChattyCathy();
})();

// In case there are some unhandled rejections this makes it easier to debug.
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

class ChattyCathy {
    app: RpcApp;
    directory: Directory;

    constructor() {
        this.app = new RpcApp({
            corePort: 9099,
            name: 'Example Mini',
            protocols: {
                example: {
                    online: async (peer: Peer, client: Client) => {
                        this.app.wish.request('identity.get', [peer.ruid], (err, user) => {
                            console.log('online:', user ? user.alias + ' (' + peer.name + ')' : 'unknown');
                        });

                        client.request('send', ['Hello!'], () => {});
                    },
                    offline: async (peer: Peer) => {
                        this.app.wish.request('identity.get', [peer.ruid], (err, user) => {
                            console.log('offline:', user ? user.alias + ' (' + peer.name + ')' : 'unknown');
                        });
                    },
                }
            },
        });

        this.app.server.insertMethods({
            _send: {},
            send: (req, res, context) => {
                console.log('Got a message:', req.args[0]);

                const message = req.args[0];
                if (typeof message !== 'string') {
                    return;
                }

                if (message.toLocaleLowerCase().includes('cathy')) {
                    this.sayWiseThings();
                }
            }
        });

        this.acceptFriendRequests();
    }

    private async sayWiseThings() {
        const clients = Object.values(this.app.clients);

        if (!clients.length) {
            // don't speak unless someone is listening..
            return; // setTimeout(chat, 4000 + Math.random() * 20000);
        }

        const msg = await getQuote();

        const hash = createHash('sha256').update(msg).digest();

        const identity = (await this.app.wish.requestAsync('identity.list', []))[0];

        if (!identity) {
            // can't say anything unless I have an Identity to use.
            return;
        }

        const signature = await this.app.wish.requestAsync('identity.sign', [identity.uid, { data: hash }]);

        for (const client of Object.values(this.app.clients)) {
            try {
                client.requestAsync('send', [msg, signature]);
            } catch (error) {
                console.log('An error:', error);
            }
        }
    }

    private async acceptFriendRequests() {
        this.directory = new Directory(this.app.wish, 'wss://relay.wishtech.fi');
        await new Promise<void>(resolve => this.directory.socket.onopen = () => resolve());
        await this.app.wish.requestAsync('identity.create', ['Cathy']).catch(err => console.log);
        const identity = (await this.app.wish.requestAsync('identity.list', []))[0];

        if (!identity) {
            return;
        }

        const entries = await this.directory.find(identity.uid);

        if (!entries[0]) {
            await this.directory.publish(identity.uid);
        } else {
            console.log('Already in directory, not publishing again.');
        }

        this.app.wish.request('signals', [], async (err, [type, data]) => {

            if (type === 'friendRequest') {
                const requests = await this.app.wish.requestAsync('identity.friendRequestList', []);

                const request = requests[0];

                if (!request) {
                    return;
                }

                console.log('Accepting friend request from:', request.alias);

                await this.app.wish.requestAsync('identity.friendRequestAccept', [request.luid, request.ruid]);
            }

            console.log('signal', type, data);
        });
    }
}

async function getQuote(): Promise<string> {
    return new Promise(resolve => {
        const options: RequestOptions = {
            method: 'GET',
            hostname: 'api.quotable.io',
            port: null,
            path: '/random',
            headers: {
                accept: 'application/json'
            }
        };

        const req = request(options, function (res) {
            const chunks = [];

            res.on('data', function (chunk) {
                chunks.push(chunk);
            });

            res.on('end', function () {
                const body = Buffer.concat(chunks);
                resolve(JSON.parse(body.toString())?.content);
            });
        });

        req.end();
    });
}
