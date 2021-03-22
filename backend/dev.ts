import { Application } from './src/application';
import { WishCoreRunner } from '@wishcore/wish-sdk';

(async () => {
    const wish1 = await WishCoreRunner.start({ cwd: './whadapp-a', nodePort: 40001, appPort: 9091 });
    const wish2 = await WishCoreRunner.start({ cwd: './whadapp-b', nodePort: 40002, appPort: 9092 });

    await Application.create({
        name: 'whadapp-a',
        ... process.env.DB ? { db: process.env.DB } : { wish: 9091, port: 8080, db: 'whadapp-a' }
    });
    await Application.create({
        name: 'whadapp-b',
        ... process.env.DB ? { db: process.env.DB } : { wish: 9092, port: 8081, db: 'whadapp-b' }
    });
})();
