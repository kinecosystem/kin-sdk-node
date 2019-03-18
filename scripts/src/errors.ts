import {TransactionId} from "./types";

export type ErrorType = 'AccountNotFoundError' | 'TransactionNotFoundError' | 'NetworkError' | 'ServerError'
	| 'FriendbotError' | 'InvalidAddressError' | 'TransactionFailedError' | 'ChannelBusyError';

export interface KinSdkError extends Error {
	readonly type: ErrorType;
}

export class AccountNotFoundError extends Error implements KinSdkError {

	readonly errorCode: number;
	readonly type: ErrorType = 'AccountNotFoundError';

	constructor(readonly accountId: string) {
		super(`Account '${accountId}' was not found in the network.`);
		this.errorCode = 404;
	}
}

export class TransactionNotFoundError extends Error implements KinSdkError {

	readonly errorCode: number;
	readonly type: ErrorType = 'TransactionNotFoundError';

	constructor(readonly transactionId: TransactionId) {
		super(`Transaction '${transactionId}' was not found in the network.`);
		this.errorCode = 404;
	}
}

export class NetworkError extends Error implements KinSdkError {
	readonly type = 'NetworkError';
}

export class ServerError extends Error implements KinSdkError {
	readonly type: ErrorType = 'ServerError';

	constructor(readonly errorCode: number, readonly errorBody?: any) {
		super(`Server error, error code: ${errorCode}`);
		this.errorCode = errorCode;
		this.errorBody = errorBody;
	}
}

export class TransactionFailedError extends ServerError {

	private readonly resultTransactionCode?: string;
	private readonly resultOperationsCode?: string[];
	readonly type: ErrorType = 'TransactionFailedError';

	constructor(readonly errorCode: number, readonly errorBody?: any) {
		super(errorCode, errorBody);
		if (errorBody && errorBody.extras) {
			this.resultTransactionCode = errorBody.extras.result_codes.transaction;
			this.resultOperationsCode = errorBody.extras.result_codes.operations;
		}
	}
}

export class FriendbotError extends Error implements KinSdkError {
	readonly type: ErrorType = 'FriendbotError';

	constructor(readonly errorCode?: number, readonly extra?: any, readonly msg?: string) {
		super(`Friendbot error, ` + (errorCode ? `error code: ${errorCode} ` : "") + (msg ? `msg: ${msg}` : ""));
		this.errorCode = errorCode;
		this.extra = extra;
	}
}

export class InvalidAddressError extends Error implements KinSdkError {
	readonly type: ErrorType = 'InvalidAddressError';

	constructor() {
		super('Invalid wallet address.');
	}
}

export class ChannelBusyError extends Error implements KinSdkError {
	readonly type: ErrorType = 'ChannelBusyError';

	constructor() {
		super('Cannot acquire a free channel.');
	}
}
