"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("redis"));
const __1 = require("..");
const SERVICE_CHANNEL = 'test-channel';
const callOptions = { timeout: 500, json: false };
const pingMessage = { type: 'PING', payload: { message: 'ping!' } };
const pongMessage = { type: 'PONG', payload: { message: 'pong!' } };
const unknownMessage = { type: 'UNKNOWN', payload: { message: 'No Message' } };
describe('rpcClientFactory', () => {
    describe('Client Factories', () => {
        describe('rpcClientFactory', () => {
            it('Allows to build an RCP client by currying', () => {
                const awaitOptions = (0, __1.rpcClientFactory)(SERVICE_CHANNEL);
                expect(awaitOptions.call).toBeDefined;
                const awaitHandlers = awaitOptions(callOptions);
                expect(awaitHandlers.call).toBeDefined;
                const factoredClient = awaitHandlers(() => ({}), () => ({}));
                expect(factoredClient.call).toBeDefined;
            });
        });
        // describe('rpcClientBuilder', () => {});
    });
    describe('rcpSend', () => {
        let mockServiceResponder;
        let mockServiceListener;
        beforeEach(() => {
            mockServiceResponder = redis_1.default.createClient();
            mockServiceListener = redis_1.default.createClient();
            mockServiceListener.on('message', (_, message) => {
                const { type, metadata } = __1.marshall.decode(message);
                const channelId = metadata === null || metadata === void 0 ? void 0 : metadata.correlationId;
                if (type === 'PING') {
                    const encodedMessage = __1.marshall.encode(channelId, pongMessage);
                    mockServiceResponder.publish(channelId, encodedMessage);
                }
            });
            mockServiceListener.subscribe(SERVICE_CHANNEL);
        });
        afterEach(() => {
            mockServiceListener.unsubscribe();
            mockServiceListener.quit();
            mockServiceResponder.quit();
            jest.restoreAllMocks();
        });
        it('should process an  RCP message', done => {
            const onError = error => {
                console.error('errorie', error);
            };
            const onSuccess = response => {
                expect(response).toContain('PONG');
                done();
            };
            const awaitOptions = (0, __1.rpcClientFactory)(SERVICE_CHANNEL);
            const awaitHandlers = awaitOptions(callOptions);
            const factoredClient = awaitHandlers(onError, onSuccess);
            factoredClient(pingMessage);
        });
        it('should timeout if the RPC does not respond', done => {
            const onSuccess = error => {
                done(error);
            };
            const onError = response => {
                expect(response).toBe('TIMEOUT');
                done();
            };
            const awaitOptions = (0, __1.rpcClientFactory)(SERVICE_CHANNEL);
            const awaitHandlers = awaitOptions(callOptions);
            const factoredClient = awaitHandlers(onError, onSuccess);
            factoredClient(unknownMessage);
        });
    });
});
//# sourceMappingURL=index.tests.js.map