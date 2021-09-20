"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("redis"));
const __1 = require("..");
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
                const awaitOptions = (0, __1.rpcClientBuilder)(SERVICE_CHANNEL);
                expect(awaitOptions.call).toBeDefined;
                const awaitHandlers = awaitOptions(callOptions);
                expect(awaitHandlers.call).toBeDefined;
                const factoredClient = awaitHandlers(() => ({}), () => ({}));
                expect(factoredClient.call).toBeDefined;
            });
        });
        describe('rpcClientFactory', () => {
            it('Allows to build an RPC client by passing a config object', () => {
                const client = (0, __1.rpcClientFactory)({
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
        let mockServiceResponder;
        let mockServiceListener;
        beforeEach(() => {
            mockServiceResponder = redis_1.default.createClient();
            mockServiceListener = redis_1.default.createClient();
            mockServiceListener.on('message', (_, message) => {
                const { type, metadata } = __1.marshall.decode(message);
                const channelId = metadata === null || metadata === void 0 ? void 0 : metadata.correlationId;
                if (type === 'PING') {
                    mockServiceResponder.publish(channelId, __1.marshall.encode(channelId, pongMessage));
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
            const onError = error => {
                done(error);
            };
            const onSuccess = response => {
                expect(typeof response).toBe('string');
                expect(response).toContain('PONG');
                done();
            };
            const client = (0, __1.rpcClientFactory)({
                options: callOptions,
                serviceChannel: SERVICE_CHANNEL,
                onError,
                onSuccess,
            });
            client(pingMessage);
        });
        it('should timeout if the RPC does not respond', done => {
            const onSuccess = error => {
                done(error);
            };
            const onError = response => {
                expect(response).toBe('TIMEOUT');
                done();
            };
            const client = (0, __1.rpcClientFactory)({
                options: { ...callOptions },
                serviceChannel: SERVICE_CHANNEL,
                onError,
                onSuccess,
            });
            client(unknownMessage);
        });
        it('the RPC call can be cancelled', done => {
            const onSuccess = error => {
                done(error);
            };
            const onError = response => {
                expect(response).toBe('TIMEOUT');
                done();
            };
            const client = (0, __1.rpcClientFactory)({
                options: { ...callOptions, timeout: 360 * 1000 },
                serviceChannel: SERVICE_CHANNEL,
                onError,
                onSuccess,
            });
            const cancel = client(unknownMessage);
            cancel();
            done();
        });
        describe('Json marshalling', () => {
            it('should process an RPC message (JSON)', done => {
                const onError = error => {
                    done(error);
                };
                const onSuccess = response => {
                    const resp = response;
                    expect(typeof response).toBe('object');
                    expect(resp.type).toBe('PONG');
                    done();
                };
                const client = (0, __1.rpcClientFactory)({
                    options: { ...callOptions, json: true },
                    serviceChannel: SERVICE_CHANNEL,
                    onError,
                    onSuccess,
                });
                client(pingMessage);
            });
            it('should fail if response cannot be marshalled', done => {
                const onError = () => {
                    done();
                };
                const client = (0, __1.rpcClientFactory)({
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
//# sourceMappingURL=index.tests.js.map