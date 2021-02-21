process.env.DB = 'data/reason-test.db';
process.env.DBTRUNCATE = 'true';

import { Application } from '../../src/application';
import { Client } from '@wishcore/reason-cli';
import { WishCore } from './wish-core';
import { Document } from '../../src/utils';
import * as crypto from 'crypto';
const BSON = new (require('bson-buffer'))();

export class TestEnvironment {
    static instance: TestEnvironment = null;

    applications: Application[] = [];
    clients: Client[] = [];
    wishs: WishCore[] = [];

    application: Application;
    client: Client;
    wish: WishCore;

    private constructor() {}

    static async getInstance() {
        if (!TestEnvironment.instance) {
            TestEnvironment.instance = new TestEnvironment();
            await TestEnvironment.instance.init();
        }

        return TestEnvironment.instance;
    }

    static publishDocument(client: Client, doc: Document, cb: (err: Error, data?: Document) => void): Buffer {
        const share = doc.share;
        delete doc.share;

        const data = BSON.serialize(doc);

        doc.share = share || { public: { license: 'SRL' } };

        doc.hash = Buffer.from(crypto.createHash('sha256').update(data).digest('hex'), 'hex');
        doc.data = data;

        client.ready().subscribe(() => {
            client.request('wish', [{ op: 'identity.sign', args: [doc.uid, { data: doc.hash }] }]).subscribe((result) => {
                doc.signed = result.data;

                client.request('document.add', [doc]).subscribe((data) => {
                    cb(null, doc);
                }, (err) => {
                    cb(err);
                });
            });
        });

        return doc.hash;
    }

    private async init() {
        this.wishs.push(new WishCore(0));
        this.applications.push(await Application.create({ db: 'reason-test-1', port: 8200, wish: 9100 }));
        this.wishs.push(new WishCore(1));
        this.applications.push(await Application.create({ db: 'reason-test-2', port: 8201, wish: 9101 }));

        await new Promise((resolve) => { setTimeout(resolve, 1500); });

        this.applications.forEach(application => application.db.dropDatabase());

        this.clients.push(new Client({ host: 'ws://localhost:8200' }));
        this.clients.push(new Client({ host: 'ws://localhost:8201' }));

        this.application = this.applications[0];
        this.client = this.clients[0];
        this.wish = this.wishs[0];
    }
}

