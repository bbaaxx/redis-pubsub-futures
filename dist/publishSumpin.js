"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rpcClientFactory_1 = require("./rpcClientFactory");
const PUBSUB_CHANNEL = process.env.PUBSUB_CHANNEL;
const callOptions = { timeout: 2000, json: true };
const message = { type: 'PING', payload: { message: 'Hello World!' } };
const factoredClient = (0, rpcClientFactory_1.rpcClientFactory)(PUBSUB_CHANNEL)(callOptions)(console.log, console.error);
factoredClient(message);
const buildClientConfig = {
    serviceChannel: PUBSUB_CHANNEL,
    options: callOptions,
    onSuccess: console.log,
    onError: console.error,
};
const builtClient = (0, rpcClientFactory_1.rpcClientBuilder)(buildClientConfig);
builtClient(message);
//# sourceMappingURL=publishSumpin.js.map