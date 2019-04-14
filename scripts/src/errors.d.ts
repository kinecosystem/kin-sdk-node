import { TransactionId } from "./types";
export interface ErrorResponse {
    type: string;
    title: string;
    status: number;
    detail?: string;
    extras?: any;
}
export declare type ErrorType = 'AccountNotFoundError' | 'HorizonError' | 'TransactionNotFoundError' | 'NetworkError' | 'ServerError' | 'FriendbotError' | 'InvalidAddress' | 'TransactionFailedError' | 'NetworkMismatchedError' | 'InvalidDataError' | 'BadRequestError' | 'InternalError' | 'NoAccountError' | 'AccountExists' | 'LowBalanceError' | 'AccountNotActivatedError' | 'ResourceNotFoundError';
export interface KinSdkError extends Error {
    readonly type: ErrorType;
}
export declare class HorizonError extends Error implements KinSdkError {
    readonly msg: string;
    readonly errorBody: ErrorResponse;
    readonly title?: string | undefined;
    readonly type: ErrorType;
    readonly resultTransactionCode?: string;
    readonly resultOperationsCode?: string[];
    readonly errorCode: number;
    constructor(msg: string, errorBody: ErrorResponse, title?: string | undefined);
}
export declare class AccountNotFoundError extends Error implements KinSdkError {
    readonly accountId?: string | undefined;
    readonly errorCode: number;
    readonly type: ErrorType;
    constructor(accountId?: string | undefined);
}
export declare class TransactionNotFoundError extends Error implements KinSdkError {
    readonly transactionId: TransactionId;
    readonly errorCode: number;
    readonly type: ErrorType;
    constructor(transactionId: TransactionId);
}
export declare class NetworkError extends Error implements KinSdkError {
    readonly type = "NetworkError";
}
export declare class NetworkMismatchedError extends Error implements KinSdkError {
    readonly type = "NetworkMismatchedError";
    constructor();
}
export declare class InvalidDataError extends Error implements KinSdkError {
    readonly type = "InvalidDataError";
    constructor();
}
export declare class ServerError extends HorizonError {
    readonly errorBody: any;
    readonly type: ErrorType;
    constructor(errorBody: any);
}
export declare class TransactionFailedError extends HorizonError {
    readonly errorBody: ErrorResponse;
    readonly title?: string | undefined;
    readonly type: ErrorType;
    constructor(errorBody: ErrorResponse, title?: string | undefined);
}
export declare class FriendbotError extends Error implements KinSdkError {
    readonly errorCode?: number | undefined;
    readonly extra?: any;
    readonly msg?: string | undefined;
    readonly type: ErrorType;
    constructor(errorCode?: number | undefined, extra?: any, msg?: string | undefined);
}
export declare class InvalidAddress extends Error implements KinSdkError {
    readonly type: ErrorType;
    constructor();
}
export declare class BadRequestError extends HorizonError {
    readonly errorBody: ErrorResponse;
    readonly title?: string | undefined;
    readonly type: ErrorType;
    constructor(errorBody: ErrorResponse, title?: string | undefined);
}
export declare class InternalError extends HorizonError {
    readonly errorBody: any;
    readonly title?: string | undefined;
    readonly type: ErrorType;
    constructor(errorBody: any, title?: string | undefined);
}
export declare class AccountExistsError extends HorizonError {
    readonly errorBody: any;
    readonly title?: string | undefined;
    readonly type: ErrorType;
    constructor(errorBody: any, title?: string | undefined);
}
export declare class LowBalanceError extends HorizonError {
    readonly errorBody: ErrorResponse;
    readonly title?: string | undefined;
    readonly type: ErrorType;
    constructor(errorBody: ErrorResponse, title?: string | undefined);
}
export declare class AccountNotActivatedError extends HorizonError {
    readonly errorBody: ErrorResponse;
    readonly title?: string | undefined;
    readonly type: ErrorType;
    constructor(errorBody: ErrorResponse, title?: string | undefined);
}
export declare class ResourceNotFoundError extends HorizonError {
    readonly errorBody: ErrorResponse;
    readonly title?: string | undefined;
    readonly type: ErrorType;
    constructor(errorBody: ErrorResponse, title?: string | undefined);
}
export declare class TranslateError {
    readonly errorBody?: any;
    private readonly _resultTransactionCode?;
    private readonly _resultOperationsCode?;
    constructor(errorBody?: any);
    translateOperationError(errorCode: number, errorBody?: any): void;
    translateTransactionError(errorCode: number, errorBody?: any): void;
    translateHorizonError(errorCode: number, errorBody?: any): void;
    includesObject(type: string, list: string[]): boolean;
}
