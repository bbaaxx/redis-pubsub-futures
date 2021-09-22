import { Cancel, RejectFunction, ResolveFunction, FutureInstance } from 'fluture';
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
export interface RcpFactoryConfig {
    serviceChannel: string;
    options: RpcSendOptions;
    onError: RejectFunction<unknown>;
    onSuccess: ResolveFunction<unknown>;
}
export declare const marshall: {
    encode: (channel: string | undefined, message: CqrsMessage) => string;
    decode: (rawMessage: string) => CqrsMessage;
};
export declare const getMessageFactory: (correlationId: string | undefined) => (message: CqrsMessage) => string;
export declare const rpcSend: (serviceChannel: string) => (options?: RpcSendOptions) => (message: CqrsMessage) => FutureInstance<Error, unknown>;
export declare const rpcClientBuilder: (serviceChannel: string) => (options: RpcSendOptions) => (onError: RejectFunction<unknown>, onSuccess: ResolveFunction<unknown>) => (message: CqrsMessage) => Cancel;
export declare const rpcClientFactory: (config: RcpFactoryConfig) => (x: CqrsMessage) => Cancel;
export declare const rpcPromiseBuilder: (serviceChannel: string) => (options: RpcSendOptions) => (message: CqrsMessage) => Promise<unknown>;
