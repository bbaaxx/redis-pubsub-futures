import redis from 'redis';
import { rpcClientBuilder, rpcClientFactory, marshall, CqrsMessage } from '..';
import { RejectFunction, ResolveFunction } from 'fluture';

jest.mock('redis', () => jest.requireActual('redis-mock'));

const SERVICE_CHANNEL = 'test-channel';

const callOptions = { timeout: 500, json: false };
const pingMessage = { type: 'PING', payload: { message: 'ping!' } };
const triggerErrorMessage = { type: 'TRIGGER_ERROR' };
const pongMessage = { type: 'PONG', payload: { message: 'pong!' } };
const unknownMessage = { type: 'UNKNOWN', payload: { message: 'No Message' } };

describe('rpcClientBuilder', () => {
  describe('Client Factories', () => {
    describe('rpcClientBuilder', () => {
      it('Allows to build an RPC client by currying', () => {
        const awaitOptions = rpcClientBuilder(SERVICE_CHANNEL);
        expect(awaitOptions.call).toBeDefined;
        const awaitHandlers = awaitOptions(callOptions);
        expect(awaitHandlers.call).toBeDefined;
        const factoredClient = awaitHandlers(
          () => ({}),
          () => ({}),
        );
        expect(factoredClient.call).toBeDefined;
      });
    });
    describe('rpcClientFactory', () => {
      it('Allows to build an RPC client by passing a config object', () => {
        const client = rpcClientFactory({
          options: callOptions,
          serviceChannel: SERVICE_CHANNEL,
          onError: x => x,
          onSuccess: x => x,
        });
        expect(client.call).toBeDefined;
      });
    });
  });

  describe('rpcSend', () => {
    let mockServiceResponder: redis.RedisClient;
    let mockServiceListener: redis.RedisClient;

    beforeEach(() => {
      mockServiceResponder = redis.createClient();
      mockServiceListener = redis.createClient();
      mockServiceListener.on('message', (_, message) => {
        const { type, metadata } = marshall.decode(message);
        const channelId = metadata?.correlationId as string;
        if (type === 'PING') {
          mockServiceResponder.publish(
            channelId,
            marshall.encode(channelId, pongMessage),
          );
        }
        if (type === 'TRIGGER_ERROR') {
          mockServiceResponder.publish(channelId, 'fail');
        }
      });
      mockServiceListener.subscribe(SERVICE_CHANNEL);
    });

    afterEach(() => {
      mockServiceListener.unsubscribe();
      mockServiceListener.quit();
      mockServiceResponder.quit();
      jest.restoreAllMocks();
      jest.resetModules();
    });

    it('should process an RPC message (text)', done => {
      const onError: RejectFunction<unknown> = error => {
        done(error);
      };
      const onSuccess: ResolveFunction<unknown> = response => {
        expect(typeof response).toBe('string');
        expect(response).toContain('PONG');
        done();
      };
      const client = rpcClientFactory({
        options: callOptions,
        serviceChannel: SERVICE_CHANNEL,
        onError,
        onSuccess,
      });

      client(pingMessage);
    });

    it('should timeout if the RPC does not respond', done => {
      const onSuccess: RejectFunction<unknown> = error => {
        done(error);
      };
      const onError: ResolveFunction<unknown> = response => {
        expect(response).toBe('TIMEOUT');
        done();
      };
      const client = rpcClientFactory({
        options: { ...callOptions },
        serviceChannel: SERVICE_CHANNEL,
        onError,
        onSuccess,
      });
      client(unknownMessage);
    });

    it.only('the RPC call can be cancelled', done => {
      const onSuccess: RejectFunction<unknown> = error => {
        done(error);
      };
      const onError: ResolveFunction<unknown> = response => {
        expect(response).toBe('TIMEOUT');
        done();
      };
      const client = rpcClientFactory({
        options: { ...callOptions, timeout: 360 * 1000 },
        serviceChannel: SERVICE_CHANNEL,
        onError: console.error,
        onSuccess: console.log,
      });
      const cancel = client(unknownMessage);
      cancel();
      done();
    });

    describe('Json marshalling', () => {
      it('should process an RPC message (JSON)', done => {
        const onError: RejectFunction<unknown> = error => {
          done(error);
        };
        const onSuccess: ResolveFunction<unknown> = response => {
          const resp = response as CqrsMessage;
          expect(typeof response).toBe('object');
          expect(resp.type).toBe('PONG');
          done();
        };
        const client = rpcClientFactory({
          options: { ...callOptions, json: true },
          serviceChannel: SERVICE_CHANNEL,
          onError,
          onSuccess,
        });

        client(pingMessage);
      });

      it('should fail if response cannot be marshalled', done => {
        const onError: RejectFunction<unknown> = () => {
          done();
        };
        const client = rpcClientFactory({
          options: { ...callOptions, json: true },
          serviceChannel: SERVICE_CHANNEL,
          onError,
          onSuccess: x => x,
        });
        client(triggerErrorMessage);
      });
    });
  });
});
