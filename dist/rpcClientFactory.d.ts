import 'dotenv-safe/config';
import { RejectFunction, ResolveFunction } from 'fluture';
declare type CqrsMessage = {
    type: string;
    payload: any;
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
export declare const rpcSend: (serviceChannel: string) => (options?: RpcSendOptions) => (message: CqrsMessage) => import("fluture").FutureInstance<unknown, unknown>;
export declare const rpcClientFactory: (serviceChannel: string) => (options: RpcSendOptions) => (onError: RejectFunction<unknown>, onSuccess: ResolveFunction<unknown>) => (message: CqrsMessage) => import("fluture").Cancel;
export declare const rpcClientBuilder: (config: RcpBuilderConfig) => (message: CqrsMessage) => import("fluture").Cancel;
export {};
