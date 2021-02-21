import { Injectable } from '@angular/core';
import { WishRpcService } from './wish-rpc.service';
import { BehaviorSubject } from 'rxjs';
import { btoh, htob } from '../util';

export interface Identity {
  uid: Uint8Array;
  alias?: string;
  privkey?: true | Uint8Array;
  pubkey?: Uint8Array;
}

export interface IdentityMap {
  [uid: string]: Identity;
}

@Injectable({
  providedIn: 'root'
})
export class WishService {
  identity = new BehaviorSubject<Identity>({ uid: new Uint8Array() });
  identityMap = new BehaviorSubject<IdentityMap>({});

  constructor(private wish: WishRpcService) {
    window['wish'] = this;
    this.wish.ready().subscribe(() => {
      this.wish.request('identity.list', []).subscribe((data) => {
        const contacts: IdentityMap = {};

        for (const i in data) {
          if (data[i].privkey) {
            // Found an identity. Set as current.
            this.identity.next(data[i]);
          }

          const uid = btoh(data[i].uid);
          contacts[uid] = data[i];
        }

        this.identityMap.next(contacts);
      }, (err) => {
        console.log('There was an error getting identity:', err);
      });
    });
  }

  btoh = btoh;
  htob = htob;
}
