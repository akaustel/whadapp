import { Application } from './src/application';
import { WishCoreRunner } from '@wishcore/wish-sdk';

(async () => {
    const wish1 = await WishCoreRunner.start({ cwd: './a', nodePort: 40001, appPort: 9091 });
    const wish2 = await WishCoreRunner.start({ cwd: './b', nodePort: 40002, appPort: 9092 });

    await Application.create({
        ... process.env.DB ? { db: process.env.DB } : { wish: 9091, port: 8080, db: 'a' }
    });
    await Application.create({
        ... process.env.DB ? { db: process.env.DB } : { wish: 9092, port: 8081, db: 'b' }
    });
})();
