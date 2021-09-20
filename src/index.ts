import Future, {
  fork,
  Cancel,
  RejectFunction,
  ResolveFunction,
  FutureInstance,
} from 'fluture';
import redis from 'redis';
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

export interface RcpFactoryConfig {
  serviceChannel: string;
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
  (serviceChannel: string) =>
  (options: RpcSendOptions = { timeout: 120 * 1000 }) =>
  (message: CqrsMessage): FutureInstance<unknown, unknown> =>
    Future((reject, resolve) => {
      const subscriber = redis.createClient();
      const publisher = redis.createClient();
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
            return reject(error);
          }
        }
        return resolve(stringMessage);
      });

      subscriber.on('subscribe', () => {
        publisher.publish(serviceChannel, messageFactory(message));
        timeoutId = setTimeout(() => {
          cleanup();
          reject('TIMEOUT');
        }, options.timeout);
      });

      subscriber.subscribe(correlationId);

      return () => cleanup();
    });

export const rpcClientBuilder =
  (serviceChannel: string) =>
  (options: RpcSendOptions) =>
  (onError: RejectFunction<unknown>, onSuccess: ResolveFunction<unknown>) =>
  (message: CqrsMessage): Cancel =>
    rpcSend(serviceChannel)(options)(message).pipe(fork(onError)(onSuccess));

export const rpcClientFactory = (
  config: RcpFactoryConfig,
): ((x: CqrsMessage) => Cancel) =>
  rpcClientBuilder(config.serviceChannel)(config.options)(
    config.onError,
    config.onSuccess,
  );
