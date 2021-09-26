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

### Using the `rpcClientBuilder`:
Build a client with a curried functionalesqe style.

```typescript
import { rpcClientBuilder } from 'redis-pubsub-futures';

const clientConfig = { serviceChannel: 'SERVICE_CHANNEL' };
const rpcOptions = { timeout: 500 };

const sendRpcCall = 
    rpcClientBuilder(clientConfig)(rpcOptions)(console.error, console.log);

// The call will return a cancel function
const sendRpcCall = sendRpcCall({ type: 'PING' });

```

### Using the `rpcClientFactory`:
Pass an object, get a disposable client.

```typescript
import { rpcClientFactory } from 'redis-pubsub-futures';

const sendRpcCall = rpcClientFactory({
    options,
    clientConfig,
    onError,
    onSuccess,
});

// calling the client returns a cancel function
const cancel = sendRpcCall({ type: 'PING', payload: 'yolo' });

```

### Using the `rpcPromiseBuilder`:
In case you hate the `Future` or you simply are more into `Promises`:

```typescript
import { rpcPromiseBuilder } from 'redis-pubsub-futures';

const clientConfig = { serviceChannel: 'SERVICE_CHANNEL' };
const rpcOptions = { timeout: 500 };

// no way to cancel this one
const rpcPromiseCaller = rpcPromiseBuilder(clientConfig)(rpcOptions);

rpcPromiseCaller({ type: 'PING', payload: 'yolo' })
    .then(console.log)
    .catch(console.error);

```


## Configuration

### Client Config
For the client, the only required parameter is `serviceChannel` which should be a string to use
as the redis pub/sub key, everything goes with the defaults unless you specify otherwise.

You can pass options directly to the `node-redis` client on the 
`clientOptions` property to define a host and password for redis among other
options, please check [their documentation here](https://github.com/NodeRedis/node-redis).

#### Connection pattern example:

```typescript
interface ClientConfig {
  serviceChannel: string;
  clientOptions?: redis.ClientOpts;
}

// example
const clientConfig = {
    serviceChannel: 'mySuperChannel',
    clientOptions: {
        url: 'redis://bob:foo@awe.some.redis.server:6380',
    }
};

const redisConnection = rpcClientBuilder(clientConfig);
```
### Rpc Options

#### Timeout
Timeout the RPC after a number of `ms` the default value is `120 * 1000`

#### JSON parsing
By default the client will return the response in `string` form, you can use the
basic included JSON parser to attempt to cast the answer to a JSON object by
including a `json` key with value of `true` in the options:

#### Dispossable client pattern example:

```typescript
interface RcpFactoryConfig extends ClientConfig {
  options: RpcSendOptions;
  onError: RejectFunction<unknown>;
  onSuccess: ResolveFunction<unknown>;
}

const clientOptions = { ... };
const rpcOptions = { 
    options: {
        json: true,
        timeout: 5000
    },
    onSuccess: console.log,
    onError: console.error,
};

rpcClientFactory({...clientOptions, rpcOptions });
```

## Lower level fluture `Futures` API:
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