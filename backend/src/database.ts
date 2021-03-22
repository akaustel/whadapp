import { MongoClient, Db, Collection, ObjectId, MongoClientOptions } from 'mongodb';

export class Database {
    name: string;

    jb: Db;

    documentsDb: Collection;
    peersDb: Collection;
    filesDb: Collection;

    private constructor() {}

    static async create(dbName = 'whadapp') {
        const instance = new Database();
        const url = 'mongodb://localhost:27017';

        const opts: MongoClientOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            pkFactory: {
                createPk: () => {
                    return new ObjectId().toString();
                }
            },
        };

        // Use connect method to connect to the server
        const client = await MongoClient.connect(url, opts).catch(() => {
            console.log('Failed to connect to database.');
            process.exit(3);
        });

        if (!client) {
            return;
        }

        instance.jb = client.db(dbName);

        await instance.jb.collection('documents').createIndex({ time: 1 });
        await instance.jb.collection('documents').createIndex({ parent: 1 });
        await instance.jb.collection('documents').createIndex({ search: 'text' });

        instance.documentsDb = instance.jb.collection('documents');

        instance.filesDb = instance.jb.collection('file');

        return instance;
    }

    dropDatabase() {
        this.jb.dropDatabase();
    }
}
