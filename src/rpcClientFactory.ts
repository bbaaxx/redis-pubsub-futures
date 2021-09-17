import 'dotenv-safe/config';
import redis from 'redis';
import { nanoid } from 'nanoid';
import { clearTimeout } from 'timers';
import Future, { fork, RejectFunction, ResolveFunction } from 'fluture';

type CqrsMessage = {
  type: string;
  payload: any;
};

type RpcSendOptions = {
  timeout?: number;
  json?: boolean;
};

type RcpBuilderConfig = {
  serviceChannel: string;
  options: RpcSendOptions;
  onError: RejectFunction<unknown>;
  onSuccess: ResolveFunction<unknown>;
};

const getMessageFactory =
  (correlationId: string | undefined) =>
  (message: CqrsMessage): string =>
    `${correlationId}::${JSON.stringify(message)}`;

export const rpcSend =
  (serviceChannel: string) =>
  (options: RpcSendOptions = { timeout: 120 * 1000 }) =>
  (message: CqrsMessage) =>
    Future((res, rej) => {
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
        rej(err);
      });

      subscriber.on('message', (channel: string, rawMessage: string) => {
        const [_, stringMessage] = rawMessage.split('::');
        cleanup();
        if (options.json) {
          try {
            return res(JSON.parse(stringMessage));
          } catch (error) {
            return rej(error);
          }
        }
        return res(stringMessage);
      });

      subscriber.on('subscribe', () => {
        publisher.publish(serviceChannel, messageFactory(message));
        timeoutId = setTimeout(() => {
          cleanup();
          rej('TIMEOUT');
        }, options.timeout);
      });

      subscriber.subscribe(correlationId);

      return () => cleanup();
    });

export const rpcClientFactory =
  (serviceChannel: string) =>
  (options: RpcSendOptions) =>
  (onError: RejectFunction<unknown>, onSuccess: ResolveFunction<unknown>) =>
  (message: CqrsMessage) =>
    rpcSend(serviceChannel)(options)(message).pipe(fork(onError)(onSuccess));

export const rpcClientBuilder = (config: RcpBuilderConfig) =>
  rpcClientFactory(config.serviceChannel)(config.options)(
    config.onError,
    config.onSuccess,
  );
