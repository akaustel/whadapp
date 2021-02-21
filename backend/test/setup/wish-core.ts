const fs = require('fs');
const mkdirp = require('mkdirp');
const child = require('child_process');

process.env.UV_THREADPOOL_SIZE = '20';

const fileName = './test/env/wish-core';
mkdirp.sync('./test/env/0');
mkdirp.sync('./test/env/1');
mkdirp.sync('./test/env/2');

if (!process.env.WISH) {
    process.env.WISH = __dirname + `/../../node_modules/@wishcore/wish-sdk/bin/wish-core-${process.arch}-${process.platform}`;
}

try {
    fs.writeFileSync(fileName, fs.readFileSync(process.env.WISH));
    fs.chmodSync(fileName, '755');
} catch (e) {
    console.log('Could not find Wish binary from WISH=' + process.env.WISH, e);
    process.exit(2);
}

const cores: WishCore[] = [];

export class WishCore {
    core: any;
    appPort: number;
    connPort: number;

    constructor(instance: number = 0) {
        this.appPort = 9100 + instance;
        this.connPort = 39100 + instance;

        this.core = child.spawn(
            '../wish-core',
            ['-p ' + this.connPort, '-a ' + this.appPort, '-s'],
            { cwd: './test/env/' + instance, /* stdio: ['ignore', 'ignore', 'ignore'] */ }
        );

        this.core.on('exit', (code) => {
            console.log('Wish core exited:', code);
        });

        cores.push(this);
    }

    kill() {
        console.log('killing', this.connPort);
        this.core.kill();
    }
}

process.on('exit', () => {
    console.log('killing cores...');
    for (const i in cores) {
        cores[i].kill();
    }
});
