import { Cancel, RejectFunction, ResolveFunction, FutureInstance } from 'fluture';
import { ClientOpts } from 'redis';
export declare type CqrsMessage = {
    type: string;
    payload?: {
        [key: string]: unknown;
    };
    metadata?: {
        correlationId?: string;
    };
};
export declare type RpcSendOptions = {
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
export declare const marshall: {
    encode: (channel: string | undefined, message: CqrsMessage) => string;
    decode: (rawMessage: string) => CqrsMessage;
};
export declare const getMessageFactory: (correlationId: string | undefined) => (message: CqrsMessage) => string;
export declare const rpcSend: ({ serviceChannel, clientOptions }: ClientConfig) => (options?: RpcSendOptions) => (message: CqrsMessage) => FutureInstance<Error, unknown>;
export declare const rpcClientBuilder: (clientOptions: ClientConfig) => (options: RpcSendOptions) => (onError: RejectFunction<unknown>, onSuccess: ResolveFunction<unknown>) => (message: CqrsMessage) => Cancel;
export declare const rpcClientFactory: (config: RcpFactoryConfig) => (x: CqrsMessage) => Cancel;
export declare const rpcPromiseBuilder: (clientOptions: ClientConfig) => (options: RpcSendOptions) => (message: CqrsMessage) => Promise<unknown>;
