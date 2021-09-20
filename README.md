# redis-pubsub-futures

This is a small wraper for [node-redis](https://github.com/NodeRedis/node-redis) 
to implement an RPC client using Redis pub/sub capabilities and [Fluture's](https://github.com/fluture-js/Fluture) monadic `Futures`. 

## Installation

```bash
npm install redis-pubsub-futures

#or

yarn add redis-pubsub-futures
```

## Usage

### Using the client factory:
```typescript
import { rpcClientFactory } from 'redis-pubsub-futures';

const sendRpcCall = rpcClientFactory({
    options: { timeout: 120 * 1000, json: true },
    serviceChannel: 'SERVICE_CHANNEL',
    onError: console.error,
    onSuccess: console.log,
});

// The call will return a cancel function
const cancel = sendRpcCall({ type: 'PING' });

```

### Using the curried builder:
```typescript
import { rpcClientBuilder } from 'redis-pubsub-futures';
const serviceChannel = 'SERVICE_CHANNEL';
const rpcOptions = { timeout: 500 }

const sendRpcCall = 
    rpcClientBuilder('SERVICE_CHANNEL')(rpcOptions)(console.error, console.log);

// The call will return a cancel function
const sendRpcCall = sendRpcCall({ type: 'PING' });

```

### JSON parsing
By default the client will return the response in `string` form, you can use the
basic included JSON parser to attempt to cast the answer to a JSON object by
including a `json` key with value of `true` in the options:

```typescript
const rpcOptions = { 
    json: true,
    //... 
};

rpcClientFactory({
    options: rpcOptions,
    serviceChannel: 'SERVICE_CHANNEL'
    //...
});

// or

rpcClientBuilder('SERVICE_CHANNEL')(rpcOptions);

```

### Lower level fluture `Futures` API:
You can also access the low level fluture Future created by the factory and builder
by importing `rpcSend`:

```typescript
import { fork } from 'fluture';
import { rpcSend } from 'redis-pubsub-futures';

const rpcFuture = 
    rpcSend('SERVICE_CHANNEL')({ timeout: 500, json: true })({ type: 'PING' });

rpcFuture.pipe(fork(console.error)(console.log));

```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)