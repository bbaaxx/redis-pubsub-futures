"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rpcPromiseBuilder = exports.rpcClientFactory = exports.rpcClientBuilder = exports.rpcSend = exports.getMessageFactory = exports.marshall = void 0;
const fluture_1 = __importStar(require("fluture"));
const redis_1 = __importDefault(require("redis"));
const nanoid_1 = require("nanoid");
const timers_1 = require("timers");
exports.marshall = {
    encode: (channel, message) => `${channel}::${JSON.stringify(message)}`,
    decode: (rawMessage) => {
        const [correlationId, stringMessage] = rawMessage.split('::');
        return {
            ...JSON.parse(stringMessage),
            metadata: { correlationId },
        };
    },
};
const getMessageFactory = (correlationId) => (message) => exports.marshall.encode(correlationId, message);
exports.getMessageFactory = getMessageFactory;
const rpcSend = (serviceChannel) => (options = { timeout: 120 * 1000 }) => (message) => (0, fluture_1.default)((reject, resolve) => {
    const subscriber = redis_1.default.createClient();
    const publisher = redis_1.default.createClient();
    const correlationId = (0, nanoid_1.nanoid)();
    const messageFactory = (0, exports.getMessageFactory)(correlationId);
    let timeoutId;
    const cleanup = () => {
        if (timeoutId)
            (0, timers_1.clearTimeout)(timeoutId);
        subscriber.unsubscribe();
        subscriber.quit();
        publisher.quit();
    };
    subscriber.on('error', err => {
        cleanup();
        reject(err);
    });
    subscriber.on('message', (_channel, rawMessage) => {
        const [, stringMessage] = rawMessage.split('::');
        cleanup();
        if (options.json) {
            try {
                return resolve(exports.marshall.decode(rawMessage));
            }
            catch (error) {
                return reject(new Error(error));
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
exports.rpcSend = rpcSend;
const rpcClientBuilder = (serviceChannel) => (options) => (onError, onSuccess) => (message) => (0, exports.rpcSend)(serviceChannel)(options)(message).pipe((0, fluture_1.fork)(onError)(onSuccess));
exports.rpcClientBuilder = rpcClientBuilder;
const rpcClientFactory = (config) => (0, exports.rpcClientBuilder)(config.serviceChannel)(config.options)(config.onError, config.onSuccess);
exports.rpcClientFactory = rpcClientFactory;
const rpcPromiseBuilder = (serviceChannel) => (options) => (message) => (0, fluture_1.promise)((0, exports.rpcSend)(serviceChannel)(options)(message));
exports.rpcPromiseBuilder = rpcPromiseBuilder;
//# sourceMappingURL=index.js.map