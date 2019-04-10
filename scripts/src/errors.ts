import {TransactionId} from "./types";

export type ErrorType =
	'AccountNotFoundError'
	| 'TransactionNotFoundError'
	| 'NetworkError'
	| 'ServerError'
	| 'FriendbotError'
	| 'InvalidAddressError'
	| 'TransactionFailedError'
	| 'ChannelBusyError'
	| 'NetworkMismatchedError'
	| 'InvalidDataError';

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

export class NetworkMismatchedError extends Error implements KinSdkError {
	readonly type = 'NetworkMismatchedError';

	constructor() {
		super(`Unable to sign whitelist transaction, network type is mismatched`)
	}
}

export class InvalidDataError extends Error implements KinSdkError {
	readonly type = 'InvalidDataError';

	constructor() {
		super(`Unable to sign whitelist transaction, invalid data`)
	}
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

	private readonly _resultTransactionCode?: string;
	private readonly _resultOperationsCode?: string[];
	readonly type: ErrorType = 'TransactionFailedError';

	constructor(readonly errorCode: number, readonly errorBody?: any) {
		super(errorCode, errorBody);
		if (errorBody && errorBody.extras) {
			this._resultTransactionCode = errorBody.extras.result_codes.transaction;
			this._resultOperationsCode = errorBody.extras.result_codes.operations;
		}
	}

	public get resultTransactionCode(): string | undefined {
		return this._resultTransactionCode;
	}

	public get resultOperationsCode(): string[] | undefined {
		return this._resultOperationsCode;
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
