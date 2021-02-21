import { Client } from '@wishcore/wish-rpc';
import { Peer, RpcApp } from '@wishcore/wish-sdk';

class Mini {
    app: RpcApp;

    constructor() {
        this.app = new RpcApp({
            corePort: 9094,
            name: 'Example Mini',
            protocols: {
                example: {
                    online: async (peer: Peer, client: Client) => {
                        this.app.wish.request('identity.get', [peer.ruid], (err, user) => {
                            console.log('online:', user ? user.alias + ' (' + peer.name + ')' : 'unknown');
                        });

                        client.request('send', ['Mini says hello!'], () => {});
                    },
                    offline: (peer: Peer) => {
                        this.app.wish.request('identity.get', [peer.ruid], (err, user) => {
                            console.log('offline:', user ? user.alias + ' (' + peer.name + ')' : 'unknown');
                        });
                    }
                }
            },
        });

        this.app.server.insertMethods({
            _send: {},
            send: (req, res, context) => {
                console.log('Got a message:', req.args[0]);
            }
        });
    }
}

const mini = new Mini();

process.stdin.resume();
process.stdin.on('data', (data) => {
    const msg = data.toString().trim();

    Object.values(mini.app.clients).forEach(async client => {
        client.request('send', [msg], () => {});
    });
});
