import { Application } from './src/application';
import { WishCoreRunner } from '@wishcore/wish-sdk';

(async () => {
    const wish = WishCoreRunner.start();

    await Application.create({
        ... process.env.DB ? { db: process.env.DB } : {}
    });
})();
