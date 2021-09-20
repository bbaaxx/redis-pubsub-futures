import 'dotenv-safe/config';
import { Cancel, RejectFunction, ResolveFunction, FutureInstance } from 'fluture';
declare type CqrsMessage = {
    type: string;
    payload?: {
        [key: string]: unknown;
    };
    metadata?: {
        correlationId?: string;
    };
};
declare type RpcSendOptions = {
    timeout?: number;
    json?: boolean;
};
declare type RcpBuilderConfig = {
    serviceChannel: string;
    options: RpcSendOptions;
    onError: RejectFunction<unknown>;
    onSuccess: ResolveFunction<unknown>;
};
export declare const marshall: {
    encode: (channel: string | undefined, message: CqrsMessage) => string;
    decode: (rawMessage: string) => CqrsMessage;
};
export declare const getMessageFactory: (correlationId: string | undefined) => (message: CqrsMessage) => string;
export declare const rpcSend: (serviceChannel: string) => (options?: RpcSendOptions) => (message: CqrsMessage) => FutureInstance<unknown, unknown>;
export declare const rpcClientFactory: (serviceChannel: string) => (options: RpcSendOptions) => (onError: RejectFunction<unknown>, onSuccess: ResolveFunction<unknown>) => (message: CqrsMessage) => Cancel;
export declare const rpcClientBuilder: (config: RcpBuilderConfig) => (x: CqrsMessage) => Cancel;
export {};
