# Wha'Dapp

## Development of the frontend

Install dependencies:

```sh
npm install
```

Start frontend at http://localhost:4200, by running:

```sh
npm start
```

Interactive API calls from browser development console:

```javascript
await rpc.requestAsync('<string-op>', [arg1, arg2, ...]);
// enumerate all endpoints available
await rpc.requestAsync('methods', []);
```

From the frontend console in the browser you can run command to `wish-core` using:

```javascript
await rpc.requestAsync('wish', ['methods', []]);
list = await rpc.requestAsync('wish', ['identity.list', []]);
uid = list[0].uid
await rpc.requestAsync('wish', ['identity.update', [uid, { address: 'Paradise Apple Street 111' }]]);
```
