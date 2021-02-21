import { TestEnvironment } from './setup/test-environment';
import 'mocha';

describe('Example test', () => {
    let env: TestEnvironment;
    let uid: Buffer;
    let uid1: Buffer;

    before(async function () {
        this.timeout(5000);
        env = await TestEnvironment.getInstance();
    });

    before('get identity 1', function (done) {
        env.clients[0].ready().subscribe(() => {
            env.clients[0].request('wish', [{ op: 'identity.list', args: [] }]).subscribe((result) => {
                uid = result.data[0].uid;
                done();
            });
        });
    });

    before('get identity 2', function (done) {
        env.clients[1].ready().subscribe(() => {
            env.clients[1].request('wish', [{ op: 'identity.list', args: [] }]).subscribe((result) => {
                uid1 = result.data[0].uid;
                done();
            });
        });
    });

    it('should get documents', (done) => {
        env.client.ready().subscribe(() => {
            env.client.request('peers', []).subscribe((data) => {
                console.log('peers:', data);
                done();
            });
        });
    });
});
