import {TransactionId} from "./types";
import * as axios from "axios";
import {
	ChangeTrustResultCode,
	CreateAccountResultCode,
	HorizonErrorList,
	OperationResultCode, PaymentResultCode,
	TransactionErrorList
} from "./blockchain/errors";

export type ErrorType =
	'AccountNotFoundError'
	| 'TransactionNotFoundError'
	| 'NetworkError'
	| 'ServerError'
	| 'FriendbotError'
	| 'InvalidAddress'
	| 'TransactionFailedError'
	| 'NetworkMismatchedError'
	| 'InvalidDataError'
	| 'BadRequestError'
	| 'InternalError'
	| 'NoAccountError'
	| 'AccountExists'
	| 'LowBalanceError'
	| 'AccountNotActivatedError';

export interface KinSdkError extends Error {
	readonly type: ErrorType;
}

export class AccountNotFoundError extends Error implements KinSdkError {

	readonly errorCode: number;
	readonly type: ErrorType = 'AccountNotFoundError';

	constructor(readonly accountId: any) {
		// fix the input argument
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
}

export class FriendbotError extends Error implements KinSdkError {
	readonly type: ErrorType = 'FriendbotError';

	constructor(readonly errorCode?: number, readonly extra?: any, readonly msg?: string) {
		super(`Friendbot error, ` + (errorCode ? `error code: ${errorCode} ` : "") + (msg ? `msg: ${msg}` : ""));
		this.errorCode = errorCode;
		this.extra = extra;
	}
}

export class InvalidAddress extends Error implements KinSdkError {
	readonly type: ErrorType = 'InvalidAddress';

	constructor() {
		super('invalid wallet address.');
	}
}

export class BadRequestError extends Error implements KinSdkError {
	readonly type: ErrorType = 'BadRequestError';

	constructor(readonly errorCode?: number, readonly extra?: any, readonly msg?: string) {
		super(`Bad Request error, ` + (errorCode ? `error code: ${errorCode} ` : "") + (msg ? `msg: ${msg}` : ""));
		this.errorCode = errorCode;
		this.extra = extra;
	}
}

export class InternalError extends Error implements KinSdkError {
	readonly type: ErrorType = 'InternalError';

	constructor(readonly errorBody?: any, readonly extra?: any) {
		super(`internal error, ` + (errorBody ? `error body: ${errorBody} ` : ""));
		this.extra = extra;
	}
}

export class AccountExistsError extends Error implements KinSdkError {
	readonly type: ErrorType = 'AccountExists';

	constructor(readonly errorBody?: any, readonly extra?: any) {
		super(`account already exists, ` + (errorBody ? `error body: ${errorBody} ` : ""));
		this.extra = extra;
	}
}

export class LowBalanceError extends Error implements KinSdkError {
	readonly type: ErrorType = 'LowBalanceError';

	constructor(readonly errorBody?: any, readonly extra?: any) {
		super(`low balance, ` + (errorBody ? `error body: ${errorBody} ` : ""));
		this.extra = extra;
	}
}

export class AccountNotActivatedError extends Error implements KinSdkError {
	readonly type: ErrorType = 'AccountNotActivatedError';

	constructor(readonly errorBody?: any, readonly extra?: any) {
		super(`account not activated, ` + (errorBody ? `error body: ${errorBody} ` : ""));
		this.extra = extra;
	}
}

export class TransalteError {
	private readonly _resultTransactionCode?: string;
	private readonly _resultOperationsCode?: string[];

	constructor(readonly errorCode: number, readonly errorBody?: any) {
		if (errorBody && errorBody.type) {
			// This is a Horizon error
			this._resultTransactionCode = errorBody.extras.result_codes.transaction;
			this._resultOperationsCode = errorBody.extras.result_codes.operations;
			if (errorBody.type.includes(HorizonErrorList.TRANSACTION_FAILED)) {
				this.translateTransactionError(errorCode, errorBody);
			} else {
				this.tranlsateHorizonError(errorCode, errorBody);
			}
		} else if (!errorBody) {
			throw new NetworkError();
		}

		throw new InternalError(errorBody);
	}

	translateOperationError(errorCode: number, errorBody?: any) {
		let resultCode;
		for (let entry in this._resultOperationsCode) {
			if (entry !== OperationResultCode.SUCCESS) {
				resultCode = entry;
				break;
			}
		}
		if (!resultCode) {
			throw new InternalError(errorBody);
		}
		if (resultCode in [OperationResultCode.BAD_AUTH,
			CreateAccountResultCode.MALFORMED,
			PaymentResultCode.NO_ISSUER,
			PaymentResultCode.LINE_FULL,
			ChangeTrustResultCode.INVALID_LIMIT]) {
			throw new BadRequestError(errorBody, errorBody);
		} else if (resultCode in [OperationResultCode.NO_ACCOUNT,
			PaymentResultCode.NO_DESTINATION]) {
			// ToDo: Make sure that the error body contains the account id
			throw new AccountNotFoundError(resultCode);
		} else if (resultCode === CreateAccountResultCode.ACCOUNT_EXISTS) {
			throw new AccountExistsError(errorCode, errorBody);
		} else if (resultCode in [[CreateAccountResultCode.LOW_RESERVE, PaymentResultCode.UNDERFUNDED]]) {
			throw new LowBalanceError(errorBody, errorCode);
		} else if (resultCode in [PaymentResultCode.SRC_NO_TRUST,
			PaymentResultCode.NO_TRUST,
			PaymentResultCode.SRC_NOT_AUTHORIZED,
			PaymentResultCode.NOT_AUTHORIZED]) {
			throw new AccountNotActivatedError(errorCode, errorBody);
		}

		throw new InternalError(errorBody);
	}

	translateTransactionError(errorCode: number, errorBody?: any) {
		// if (this._resultTransactionCode as keyof typeof TransactionErrorList) {
		if (this._resultTransactionCode === TransactionErrorList.FAILED) {
			this.translateOperationError(errorCode, errorBody);
		} else if (this._resultTransactionCode === TransactionErrorList.NO_ACCOUNT) {
			// ToDo: check the account address
			throw new AccountNotFoundError(errorBody);
		} else if (this._resultTransactionCode === TransactionErrorList.INSUFFICIENT_BALANCE) {
			throw new LowBalanceError(errorBody, errorBody);
		} else if (this._resultTransactionCode as keyof typeof TransactionErrorList) {
			throw new BadRequestError(errorCode, errorBody);
		}

		throw new InternalError(errorBody);
	}

	tranlsateHorizonError(errorCode: number, errorBody?: any) {
		if (errorBody.type.includes(HorizonErrorList.RATE_LIMIT_EXCEEDED) ||
			errorBody.type.includes(HorizonErrorList.SERVER_OVER_CAPACITY) ||
			errorBody.type.includes(HorizonErrorList.TIMEOUT)) {
			throw new ServerError(errorCode, errorBody);
		} else if (this._resultTransactionCode! as keyof typeof TransactionErrorList) {
			throw new BadRequestError(errorCode, errorBody.extras)
		}

		throw new InternalError(errorBody);
	}
}
