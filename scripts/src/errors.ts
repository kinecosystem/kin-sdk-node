import {TransactionId} from "./types";

export interface KinSdkError extends Error {
	readonly errorCode?: number;
}

export class AccountNotFoundError extends Error implements KinSdkError {

	readonly errorCode: number;

	constructor(readonly accountId: string) {
		super(`Account '${accountId}' was not found in the network.`);
		this.errorCode = 404;
	}
}

export class TransactionNotFoundError extends Error implements KinSdkError {

	readonly errorCode: number;

	constructor(readonly transactionId: TransactionId) {
		super(`Transaction '${transactionId}' was not found in the network.`);
		this.errorCode = 404;
	}
}

export class NetworkError extends Error implements KinSdkError {
}

export class ServerError extends Error implements KinSdkError {

	constructor(readonly errorCode: number, readonly errorBody?: any) {
		super(`Server error, error code: ${errorCode}`);
		this.errorCode = errorCode;
		this.errorBody = errorBody;
	}
}

export class TransactionFailedError extends ServerError {

	private readonly resultTransactionCode?: string;
	private readonly resultOperationsCode?: string[];

	constructor(readonly errorCode: number, readonly errorBody?: any) {
		super(errorCode, errorBody);
		if (errorBody && errorBody.extras) {
			this.resultTransactionCode = errorBody.extras.result_codes.transaction;
			this.resultOperationsCode = errorBody.extras.result_codes.operations;
		}
	}
}

export class FriendbotError extends Error implements KinSdkError {

	constructor(readonly errorCode?: number, readonly extra?: any, readonly msg?: string) {
		super(`Friendbot error, ` + (errorCode ? `error code: ${errorCode} ` : "") + (msg ? `msg: ${msg}` : ""));
		this.errorCode = errorCode;
		this.extra = extra;
	}
}

export class InvalidAddress extends Error {
	constructor() {
		super('invalid wallet address.');
	}
}