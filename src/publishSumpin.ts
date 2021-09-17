import { rpcClientFactory, rpcClientBuilder } from './rpcClientFactory';

const PUBSUB_CHANNEL = process.env.PUBSUB_CHANNEL as string;
const callOptions = { timeout: 2000, json: true };
const message = { type: 'PING', payload: { message: 'Hello World!' } };

const factoredClient = rpcClientFactory(PUBSUB_CHANNEL)(callOptions)(
  console.log,
  console.error,
);
factoredClient(message);

const buildClientConfig = {
  serviceChannel: PUBSUB_CHANNEL,
  options: callOptions,
  onSuccess: console.log,
  onError: console.error,
};
const builtClient = rpcClientBuilder(buildClientConfig);

builtClient(message);
