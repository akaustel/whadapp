import { Injectable } from '@angular/core';
import { RpcService } from './rpc.service';
import { WishRpcService } from './wish/wish-rpc.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { addMessage, Message, reset, setMessages } from 'src/reducers/message.actions';
import { btoh, stripEmptyKeys } from './util';

@Injectable({
    providedIn: 'root'
})
export class ReasonService {
    peers = new BehaviorSubject<any[]>([]);
    messages: Observable<Message[]>;
    identities;

    port = '' + (parseInt(window.location.port, 10) - 4200 + 8080);
    url = 'http://' + window.location.hostname + ':' + this.port;

    constructor(
        private rpc: RpcService,
        private store: Store<{ identities: any[], messages: any[] }>,
        private wish: WishRpcService
    ) {
        window['reason'] = this;

        this.identities = store.select('identities');
        this.messages = store.select('messages');

        this.rpc.ready().subscribe(async () => {

            this.store.dispatch(
                setMessages({ messages: await this.rpc.requestAsync('list', []) })
            );

            this.peersList();
            this.rpc.request('signals', []).subscribe((data) => {
                const type = data[0];

                if (type === 'peer.online' || type === 'peer.offline') {
                    this.peersList();
                }
                if (type === 'message') {
                    const msg: Message = data[1];
                    const context = data[2];
                    const peer = context.peer;
                    const message = { content: msg.content, files: msg.files, from: btoh(peer.ruid), time: Date.now() };

                    this.store.dispatch(addMessage({ message }));
                }
            });
        });
    }

    async peersList() {
        const peers: any[] = await this.rpc.requestAsync('peers', []);
        this.peers.next(peers);
    }

    identity(uid: string) {
        return this.wish.identity(uid);
    }

    async broadcast(content: string, file?: string) {
        const message: Message = stripEmptyKeys<Message>({
            content,
            files: file ? [file] : undefined,
            from: btoh(this.wish.selectedIdentity),
            time: Date.now(),
        });

        this.store.dispatch(addMessage({ message }));
        await this.rpc.requestAsync('send', [message]);
    }

    changeTheme(themeName) {
        document.getElementById('themeAsset')['href'] = `/path/to/my/${themeName}.css`;
    }

    /** Clear all messages from store */
    reset() {
        this.store.dispatch(reset());
    }

    imgSrc(hash: Uint8Array | string, opts?: { size: string }) {
        if (hash instanceof Uint8Array) {
            hash = btoh(hash);
        }

        return this.url  + '/image/' + hash + (opts && opts.size ? opts.size : '');
    }
}
