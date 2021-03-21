import { Application } from './application';
import { createReadStream, renameSync, mkdirSync, statSync, Stats, ReadStream, createWriteStream } from 'fs';
import { createHash } from 'crypto';
import sharp = require('sharp');
import express = require('express');
import { mimeFromFile } from './utils';

const multiparty = require('connect-multiparty')();
const cors = require('cors');

interface SizeMap {
    [key: string]: {
        width?: number,
        height?: number,
        fit?: 'cover',
    };
}

/** Image sizes */
const sizes: SizeMap = {
    square100: { width: 100, height: 100, fit: 'cover' },
    small: { width: 400, height: 300, fit: 'cover' },
    '720p': { width: 1280, height: 720, fit: 'cover' },
    '1080p': { width: 1920, height: 1080, fit: 'cover' },
    '2k': { width: 2560, height: 1440, fit: 'cover' },
    '4k': { width: 3840, height: 2160, fit: 'cover' },
    '8k': { width: 7680, height: 4320, fit: 'cover' },
    original: {},
};

interface DbFile {
    hash: string;
    name: string;
    size: string;
    type: string;
}

export class WebHttp {
    http: any;

    constructor(
        private application: Application,
        port: string | number
    ) {
        // Create a new express app instance
        const app: express.Application = express();

        this.http = app.listen(port);

        app.use(cors());

        app.post('/upload', multiparty, (req, res) => {
            const files = req['files'];

            if (!files) {
                return res.status(500).send('Expected file');
            }

            if (Array.isArray(files)) {
                return res.status(500).send('One file at a time.');
            }

            if (!files.file || !files.file.path) {
                return res.status(500).send('Upload failed');
            }

            // eslint-disable-next-line security/detect-non-literal-fs-filename
            const readStream = createReadStream(files.file.path);
            const hash = createHash('sha256');

            readStream.pipe(hash).on('data', (hashBin: Buffer) => {
                const hash = hashBin.toString('hex');

                try {
                    mkdirSync('./files');
                } catch (e) {}
                try {
                    mkdirSync('./files/' + hash.substr(0, 2));
                } catch (e) {}

                renameSync(files.file.path, WebHttp.pathFromHash(hash));

                const type = mimeFromFile(files.file);

                application.db.filesDb.insertOne({
                    hash,
                    type,
                    name: files.file.name,
                    size: files.file.size
                });

                res.status(200).json({ hash, type });
            });
        });

        app.get('/image/:imageId/:sizeId?', async (req, res) => {
            const hash = req.params.imageId;
            const sizeId = req.params.sizeId || 'small';

            if (!sizes[sizeId]) {
                return res.status(401).send('Invalid size.');
            }

            const { width, height, fit } = sizes[sizeId];

            const cacheId = width + 'x' + height + '-' + fit;
            const cacheFile = WebHttp.cachePathFromHash(hash, cacheId);
            const cacheFileType = 'image/jpeg';
            const cacheReadStream = await this.imageCacheReadStream(hash, cacheFile);

            if (cacheReadStream) {
                cacheReadStream.on('error', error => {
                    return res.status(403).json({ msg: 'Fail', code: 13, debug: error });
                });

                res.header('Content-Type', cacheFileType);

                return cacheReadStream.pipe(res);
            }

            try {
                mkdirSync('/tmp/whadapp');
            } catch (error) {}
            try {
                mkdirSync('/tmp/whadapp/' + hash.substr(0, 2));
            } catch (error) {}

            const resize = sharp().resize(width, height, { fit }).jpeg();

            const resized = createReadStream(WebHttp.pathFromHash(hash))
                .on('error', error => {
                    return res.status(403).json({ msg: 'Fail', code: 12, debug: error });
                })
                .pipe(resize);

            res.header('Content-Type', cacheFileType);

            resized.pipe(res);
            resized.pipe(createWriteStream(cacheFile));
        });

        app.get('/video/:hash', async (req, res) => {
            const hash = req.params.hash;
            const range = req.headers.range;

            const path = WebHttp.pathFromHash(hash);

            let stat: Stats;

            try {
                stat = statSync(path);
            } catch (err) {
                return res.status(404).send('Video not found');
            }

            const fileSize = stat.size;

            const meta = await application.db.filesDb.findOne<DbFile>({ hash });

            if (!meta) {
                return res.status(404).send('Video not found (meta missing)');
            }

            if (typeof range === 'string') {
                const parts = range.replace(/bytes=/, '').split('-');

                const start = parseInt(parts[0], 10);
                const end = parts[1]
                    ? parseInt(parts[1], 10)
                    : fileSize - 1;
                const chunksize = (end - start) + 1;

                let file: ReadStream;

                try {
                    file = createReadStream(path, { start, end });
                } catch (err) {
                    return res.status(404).send('Video not found (content missing)');
                }

                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': meta.type,
                };

                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': meta.type,
                };

                res.writeHead(200, head);
                createReadStream(path).pipe(res);
            }
        });
    }

    static pathFromHash(hash: string) {
        return './files/' + hash.substr(0, 2) + '/' + hash + '.bin';
    }

    static cachePathFromHash(hash: string, id: string) {
        return '/tmp/whadapp/' + hash.substr(0, 2) + '/' + hash + '-' + id + '.bin';
    }

    async imageCacheReadStream(hash: string, file: string) {
        let stat: Stats;

        try {
            stat = statSync(file);
        } catch (err) { }

        if (!stat) {
            return null;
        }

        return createReadStream(file);
    }
}
