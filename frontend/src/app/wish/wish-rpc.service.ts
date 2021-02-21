import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Observer } from 'rxjs';
import { RpcService } from '../rpc.service';
import { btoh } from '../util';
import { selectIdentity, setIdentities } from '../../reducers/wish.actions';
import { Identity } from './wish.service';

@Injectable({
  providedIn: 'root'
})
export class WishRpcService {
  readyState = false;
  readyCb = [];
  identities: any = {};
  selectedIdentity: Uint8Array;

  constructor(
    private rpc: RpcService,
    private store: Store<{ identities: Identity[] }>,
  ) {
    window['wishRpc'] = this;

    const poll = setInterval(async () => {
      await this.identityList();

      clearInterval(poll);
      this.readyState = true;
      this.readyCb.forEach((cb) => cb());
      this.readyCb = [];

      this.signals();
    }, 1000);
  }

  private signals() {
    this.request('signals', []).subscribe((event) => {
      const signal = event[0];
      const meta = event[1];

      if (signal === 'connections') {
        // this.connectionsList();
      } else if (signal === 'identity') {
        this.identityList();
      } else if (signal === 'friendRequest') {
        // this.friendRequestList();
      } else if (signal === 'localDiscovery') {
        // this.discoverList();
      } else if (signal === 'ok') {
        // subscribed successfully
      } else {
        console.log('unhandled signal:', signal, meta);
      }
    });
  }

  private async identityList() {
    return new Promise<void>((resolve, reject) => {
      this.request('identity.list', []).subscribe((data) => {
        this.store.dispatch(setIdentities({ identities: data }));

        const map = {};

        for (const identity of data) {
          const uid = btoh(identity.uid);
          map[uid] = identity;

          if (identity.privkey) {
            this.selectedIdentity = identity.uid;
          }
        }

        const selected = data.find(identity => identity.privkey);

        this.store.dispatch(selectIdentity({ identity: selected || null }));

        this.identities = map;

        resolve();
      });
    });
  }

  public identity(uid) {
    uid = typeof uid === 'string' ? uid : btoh(uid);
    return this.identities[uid] || { alias: 'n/a' };
  }

  public isMe(uid: Uint8Array) {
    return this.selectedIdentity && btoh(this.selectedIdentity) === btoh(uid);
  }

  public ready() {
    if (this.readyState) {
      return Observable.create((observer: Observer<any>) => {
        observer.next(null);
        observer.complete();
      });
    }

    return Observable.create((observer: Observer<any>) => {
      this.readyCb.push(() => {
        observer.next(null);
        observer.complete();
      });
    });
  }

  public request(op: string, args: any): Observable<any> {
    return Observable.create((observer: Observer<any>) => {
      this.rpc.request('wish', [op, args]).subscribe((response) => {
        observer.next(response.data);

        if (!response.sig) {
          observer.complete();
        }
      });
    });
  }
}
