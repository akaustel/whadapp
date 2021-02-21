import { Application } from './application';
import express = require('express');
import { Server } from 'http';

const multiparty = require('connect-multiparty')();
const cors = require('cors');

export class WebHttp {
    http: Server;

    constructor(
        private application: Application,
        port: string | number
    ) {
        // Create a new express app instance
        const app: express.Application = express();

        this.http = app.listen(port);

        app.use(cors());
    }
}
