import { Component, OnInit, OnDestroy } from '@angular/core';
import { WishRpcService } from '../wish/wish-rpc.service';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { btoh } from '../util';
import { ReasonService } from '../reason.service';
import { FormControl } from '@angular/forms';
import { RpcService } from '../rpc.service';
import { createSelector, Store } from '@ngrx/store';
import { WishState } from 'src/reducers/wish.reducer';
import { Identity } from '../wish/wish.service';

interface Connection {
  /** Local User Id */
  luid: Uint8Array;
  /** Remote User Id */
  ruid: Uint8Array;
  /** Remote Host Id */
  rhid: Uint8Array;
  /** Remote Service Id */
  rsid: Uint8Array;
  /** Connection id */
  cid: number;
  /** Outgoing or incoming connection */
  outgoing: boolean;
  /** Relayed connection */
  relay: boolean;
}

const projectIdentity = (state: WishState) => state.identity;

export const selectIdentity = createSelector(projectIdentity, identity => identity);

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss']
})
export class DebugComponent implements OnInit, OnDestroy {
  peers: any[];
  connections: Connection[];
  identity = new BehaviorSubject<Identity>(null);
  identities = new BehaviorSubject<Identity[]>([]);
  friendRequests: { alias: string, luid: Uint8Array, ruid: Uint8Array }[];
  discovered: { alias: string, ruid: Uint8Array, rhid: Uint8Array }[];
  directory: { _id: string, alias: string, uid: Uint8Array, cert: any }[];

  ownDirectoryEntry: { _id: string, alias: string, uid: Uint8Array };

  search = new FormControl('');

  private onDestroy = new Subject();

  constructor(
    public wish: WishRpcService,
    private reason: ReasonService,
    private router: Router,
    private rpc: RpcService,
    private store: Store<{ count: number, wish: WishState }>,
  ) {
    store.select(state => state.wish.identities).subscribe(this.identities);
    this.identities.pipe(takeUntil(this.onDestroy)).subscribe({
      next: identities => identities[0] && this.identity.next(identities[0])
    });
  }

  ngOnInit() {
    this.wish.ready().subscribe(() => {
      this.connectionsList();
      // this.identityList();
      this.discoverList();

      this.wish.request('signals', []).pipe(takeUntil(this.onDestroy)).subscribe((event) => {
        const signal = event[0];
        const meta = event[1];

        if (signal === 'connections') {
          this.connectionsList();
        } else if (signal === 'identity') {
        } else if (signal === 'friendRequest') {
          this.friendRequestList();
        } else if (signal === 'localDiscovery') {
          this.discoverList();
        } else if (signal === 'ok') {
          // subscribed successfully
        } else {
          console.log('unhandled signal:', signal, meta);
        }
      });
    });

    this.reason.peers.pipe(takeUntil(this.onDestroy)).subscribe((peers) => { this.peers = peers; });
    this.updateOwnDirectoryEntry();
  }

  ngOnDestroy() {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  connectionsList() {
    this.wish.request('connections.list', []).subscribe((data) => {
      this.connections = data;
    });
  }

  identityList() {
    /*
    this.wish.request('identity.list', []).subscribe((data) => {
      this.identity = data[0];
      this.identities = data;
    });
    */
  }

  friendRequestList() {
    this.wish.request('identity.friendRequestList', []).subscribe((data) => {
      this.friendRequests = data;
    });
  }

  friendRequestAccept(luid, ruid) {
    this.wish.request('identity.friendRequestAccept', [luid, ruid]).subscribe();
  }

  friendRequestDecline(luid, ruid) {
    this.wish.request('identity.friendRequestDecline', [luid, ruid]).subscribe();
  }

  discoverList() {
    this.wish.request('wld.list', []).subscribe((data) => {
      const exclude = this.knownIdentityMap();

      this.discovered = data.filter(request => !exclude[btoh(request.ruid)]);
    });
  }

  friendRequest(entry) {
    this.wish.request('wld.friendRequest', [this.identity.value?.uid, entry.ruid, entry.rhid]).subscribe();
  }

  identityRemove(uid) {
    this.wish.request('identity.remove', [uid]).subscribe();
  }

  disconnect(cid) {
    this.wish.request('connections.disconnect', [cid]).subscribe();
  }

  navigateToProfile(uid) {
    this.router.navigate(['profile', btoh(uid)]);
  }

  async publish(uid: Uint8Array) {
    await this.rpc.requestAsync('directory.publish', [uid]);
    await this.updateOwnDirectoryEntry();
  }

  /** Fake implementation which removes entry from directory without any checks */
  async unpublish(_id: Uint8Array) {
    await this.rpc.requestAsync('directory.remove', [_id]);
    await this.updateOwnDirectoryEntry();
  }

  async updateOwnDirectoryEntry() {
    const list = await this.rpc.requestAsync('directory.find', [this.identity.value?.uid]);
    this.ownDirectoryEntry = list[0] || null;
  }

  async find(search: string | Buffer) {
    const result = await this.rpc.requestAsync('directory.find', [search]);

    const exclude = this.knownIdentityMap();

    this.directory = result.filter(request => !exclude[btoh(request.uid)]);
  }

  /** Returns map of known uids with hex string key */
  private knownIdentityMap() {
    const knownMap = {};

    this.identities.value?.forEach(identity => knownMap[btoh(identity.uid)] = true);

    return knownMap;
  }

  async directoryFriendRequest(contact: { cert: any }) {
    const freq = await this.rpc.requestAsync('directory.friendRequest', [this.identity.value?.uid, contact]);
    console.log('freq', contact, freq);
  }
}
