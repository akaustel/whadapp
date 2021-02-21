import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { Client, ResponseMessage } from '@wishcore/wish-rpc';

declare function bson(): any;
const { BSON } = bson();

@Injectable({
  providedIn: 'root'
})
export class RpcService {
  client: Client;
  port = '8080'; // '' + (parseInt(window.location.port, 10) - 4200 + 8080);
  host = 'ws://' + window.location.hostname + ':' + this.port;
  socket: WebSocket;
  readyCb = [];
  readyState = false;

  constructor() {
    window['rpc'] = this;
    this.connect();
  }

  connect() {
    this.socket = new WebSocket(this.host);
    this.socket.binaryType = 'arraybuffer';

    this.socket.onopen = () => {
      console.log('WebSocket connected.');

      this.client = new Client((msg: ResponseMessage) => {
        this.socket.send(BSON.serialize(msg));
      });

      this.socket.onmessage = (ev) => {
        let msg: any;

        try {
          msg = BSON.deserialize(new Uint8Array(ev.data));
        } catch (e) { return console.log('Error:', e, ev.data); }

        this.client.messageReceived(msg);
      };

      this.socket.onclose = () => {
        console.log('WebSocket closed.');
        this.readyState = false;
        setTimeout(this.connect.bind(this), 2000);
      };

      this.readyState = true;
      this.readyCb.forEach((cb) => cb());
    };

    this.socket.onerror = () => {
      this.readyState = false;
      setTimeout(this.connect.bind(this), 2000);
    };
}

  public ready() {
    if (this.readyState) {
      return new Observable((observer: Observer<void>) => {
        observer.next();
      });
    }

    return new Observable((observer: Observer<void>) => {
      this.readyCb.push(() => {
        observer.next();
      });
    });
  }

  public request(op: string, args: any) {
    if (this.socket.readyState !== this.socket.OPEN) {
      return Observable.create((observer: Observer<any>) => {
        observer.error({ code: 7, msg: "We're not connected yet.", op, args });
      });
    }

    return Observable.create((observer: Observer<any>) => {
      this.client.request(op, args, (err, data: any, end: boolean) => {
        if (err) {
          observer.error(err);
          return;
        }

        if (window.localStorage.getItem('debug')) {
          console.log(op, '> ', data);
        }

        observer.next(data);
        if (end) {
          observer.complete();
        }
      });
    });
  }

  requestAsync(op: string, args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.request(op, args, (err, data: any, end: boolean) => {
        if (err) {
          return reject(data);
        }

        resolve(data);
      });
    });
  }

  public cancel(requestId: number) {}
}
