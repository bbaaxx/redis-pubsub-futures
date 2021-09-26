import Future, {
  fork,
  promise,
  Cancel,
  RejectFunction,
  ResolveFunction,
  FutureInstance,
} from 'fluture';
import redis, { ClientOpts } from 'redis';
import { nanoid } from 'nanoid';
import { clearTimeout } from 'timers';

export type CqrsMessage = {
  type: string;
  payload?: { [key: string]: unknown };
  metadata?: {
    correlationId?: string;
  };
};

export type RpcSendOptions = {
  timeout?: number;
  json?: boolean;
};

export interface ClientConfig {
  serviceChannel: string;
  clientOptions?: ClientOpts;
}

export interface RcpFactoryConfig extends ClientConfig {
  options: RpcSendOptions;
  onError: RejectFunction<unknown>;
  onSuccess: ResolveFunction<unknown>;
}

export const marshall = {
  encode: (channel: string | undefined, message: CqrsMessage): string =>
    `${channel}::${JSON.stringify(message)}`,
  decode: (rawMessage: string): CqrsMessage => {
    const [correlationId, stringMessage] = rawMessage.split('::');
    return {
      ...JSON.parse(stringMessage),
      metadata: { correlationId },
    };
  },
};

export const getMessageFactory =
  (correlationId: string | undefined) =>
  (message: CqrsMessage): string =>
    marshall.encode(correlationId, message);

export const rpcSend =
  ({ serviceChannel, clientOptions = {} }: ClientConfig) =>
  (options: RpcSendOptions = { timeout: 120 * 1000 }) =>
  (message: CqrsMessage): FutureInstance<Error, unknown> =>
    Future((reject, resolve) => {
      const subscriber = redis.createClient(clientOptions);
      const publisher = redis.createClient(clientOptions);
      const correlationId = nanoid();
      const messageFactory = getMessageFactory(correlationId);
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        subscriber.unsubscribe();
        subscriber.quit();
        publisher.quit();
      };

      subscriber.on('error', err => {
        cleanup();
        reject(err);
      });

      subscriber.on('message', (_channel: string, rawMessage: string) => {
        const [, stringMessage] = rawMessage.split('::');
        cleanup();
        if (options.json) {
          try {
            return resolve(marshall.decode(rawMessage));
          } catch (error) {
            return reject(new Error(error as string));
          }
        }
        return resolve(stringMessage);
      });

      subscriber.on('subscribe', () => {
        publisher.publish(serviceChannel, messageFactory(message));
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('TIMEOUT'));
        }, options.timeout);
      });

      subscriber.subscribe(correlationId);

      return () => cleanup();
    });

export const rpcClientBuilder =
  (clientOptions: ClientConfig) =>
  (options: RpcSendOptions) =>
  (onError: RejectFunction<unknown>, onSuccess: ResolveFunction<unknown>) =>
  (message: CqrsMessage): Cancel =>
    rpcSend(clientOptions)(options)(message).pipe(fork(onError)(onSuccess));

export const rpcClientFactory = (
  config: RcpFactoryConfig,
): ((x: CqrsMessage) => Cancel) =>
  rpcClientBuilder({
    serviceChannel: config.serviceChannel,
    clientOptions: config.clientOptions,
  })(config.options)(config.onError, config.onSuccess);

export const rpcPromiseBuilder =
  (clientOptions: ClientConfig) =>
  (options: RpcSendOptions) =>
  (message: CqrsMessage): Promise<unknown> =>
    promise(rpcSend(clientOptions)(options)(message));
