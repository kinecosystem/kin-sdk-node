import {TransactionId} from "./types";
import {
	ChangeTrustResultCode,
	CreateAccountResultCode,
	HorizonErrorList,
	OperationResultCode,
	PaymentResultCode,
	TransactionErrorList
} from "./blockchain/errors";

class ErrorUtils {
	static getTransaction(errorBody: any): string | undefined {
		if (errorBody && errorBody.extras && errorBody.extras.result_codes.transaction) {
			return errorBody.extras.result_codes.transaction;
		}

		return undefined;
	}

	static getOperations(errorBody: any): string[] | undefined {
		if (errorBody && errorBody.extras && errorBody.extras.result_codes.operations) {
			return errorBody.extras.result_codes.operations;
		}

		return undefined;
	}
}

export interface ErrorResponse {
	type: string,
	title: string,
	status: number,
	detail?: string,
	extras?: any
}

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
	| 'AccountNotActivatedError'
	| 'HorizonError'
	| 'ResourceNotFoundError';

export interface KinSdkError extends Error {
	readonly type: ErrorType;
}

export class HorizonError extends Error implements KinSdkError {
	readonly type: ErrorType = 'HorizonError';

	readonly resultTransactionCode?: string;
	readonly resultOperationsCode?: string[];
	readonly errorCode: number;

	constructor(readonly msg: string, readonly errorBody: ErrorResponse, readonly title?: string) {
		super(`${msg}, error code: ${errorBody.status} ` + ((title ? `title: ${errorBody.title}` : "")));
		this.errorCode = errorBody.status;
		this.errorBody = errorBody;
		this.resultTransactionCode = ErrorUtils.getTransaction(errorBody);
		this.resultOperationsCode = ErrorUtils.getOperations(errorBody);
	}
}

export class AccountNotFoundError extends Error implements KinSdkError {

	readonly errorCode: number;
	readonly type: ErrorType = 'AccountNotFoundError';

	constructor(readonly accountId?: string) {
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

export class ServerError extends HorizonError {
	readonly type: ErrorType = 'ServerError';

	constructor(readonly errorBody: any) {
		super(`Server error`, errorBody);
	}
}

export class TransactionFailedError extends HorizonError {
	readonly type: ErrorType = 'TransactionFailedError';

	constructor(readonly errorBody: ErrorResponse, readonly title?: string) {
		super(`Transaction failed error`, errorBody, title);
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

export class BadRequestError extends HorizonError {
	readonly type: ErrorType = 'BadRequestError';

	constructor(readonly errorBody: ErrorResponse, readonly title?: string) {
		super(`Bad Request error`, errorBody, title);
	}
}

export class InternalError extends HorizonError {
	readonly type: ErrorType = 'InternalError';

	constructor(readonly errorBody: any, readonly title?: string) {
		super(`internal error`, errorBody, title ? title : "{'internal_error': 'unknown horizon error'}");
	}
}

export class AccountExistsError extends HorizonError {
	readonly type: ErrorType = 'AccountExists';

	constructor(readonly errorBody: any, readonly title?: string) {
		super(`account already exists`, errorBody, title);
	}
}

export class LowBalanceError extends HorizonError {
	readonly type: ErrorType = 'LowBalanceError';

	constructor(readonly errorBody: ErrorResponse, readonly title?: string) {
		super(`low balance`, errorBody, title);
	}
}

export class AccountNotActivatedError extends HorizonError {
	readonly type: ErrorType = 'AccountNotActivatedError';

	constructor(readonly errorBody: ErrorResponse, readonly title?: string) {
		super(`account not activated`, errorBody, title);
	}
}

export class ResourceNotFoundError extends HorizonError {
	readonly type: ErrorType = 'ResourceNotFoundError';

	constructor(readonly errorBody: ErrorResponse, readonly title?: string) {
		super(`resources not found`, errorBody, title);
	}
}

export class TranslateError {
	private readonly _resultTransactionCode?: string;
	private readonly _resultOperationsCode?: string[];

	constructor(readonly errorBody?: any) {
		if (errorBody && errorBody.response) {
			errorBody = errorBody.response;
			if (errorBody.type && errorBody.status) {
				// This is a Horizon error
				this._resultTransactionCode = ErrorUtils.getTransaction(errorBody);
				this._resultOperationsCode = ErrorUtils.getOperations(errorBody);
				if (errorBody.type.includes(HorizonErrorList.TRANSACTION_FAILED)) {
					this.translateTransactionError(errorBody.status, errorBody);
				} else {
					this.translateHorizonError(errorBody.status, errorBody);
				}
			} else {
				throw new InternalError(errorBody);
			}
		} else {
			throw new NetworkError();
		}
	}

	translateOperationError(errorCode: number, errorBody?: any) {
		let resultCode;
		if (this._resultOperationsCode === undefined || this._resultOperationsCode.length === 0) {
			throw new InternalError(errorBody);
		}

		for (let entry of this._resultOperationsCode) {
			if (entry !== OperationResultCode.SUCCESS) {
				resultCode = entry;
				break;
			}
		}
		if (!resultCode) {
			throw new InternalError(errorBody);
		}
		if (this.includesObject(resultCode, [OperationResultCode.BAD_AUTH,
			CreateAccountResultCode.MALFORMED,
			PaymentResultCode.NO_ISSUER,
			PaymentResultCode.LINE_FULL,
			ChangeTrustResultCode.INVALID_LIMIT])) {
			throw new BadRequestError(errorBody);
		} else if (this.includesObject(resultCode, [OperationResultCode.NO_ACCOUNT,
			PaymentResultCode.NO_DESTINATION])) {
			throw new AccountNotFoundError();
		} else if (resultCode === CreateAccountResultCode.ACCOUNT_EXISTS) {
			throw new AccountExistsError(errorCode, errorBody);
		} else if (this.includesObject(resultCode, [CreateAccountResultCode.LOW_RESERVE, PaymentResultCode.UNDERFUNDED])) {
			throw new LowBalanceError(errorBody);
		} else if (this.includesObject(resultCode, [PaymentResultCode.SRC_NO_TRUST,
			PaymentResultCode.NO_TRUST,
			PaymentResultCode.SRC_NOT_AUTHORIZED,
			PaymentResultCode.NOT_AUTHORIZED])) {
			throw new AccountNotActivatedError(errorBody);
		}

		throw new InternalError(errorBody);
	}

	translateTransactionError(errorCode: number, errorBody?: any) {
		if (this._resultTransactionCode === TransactionErrorList.FAILED) {
			this.translateOperationError(errorCode, errorBody);
		} else if (this._resultTransactionCode === TransactionErrorList.NO_ACCOUNT) {
			// ToDo: check the account address
			throw new AccountNotFoundError(errorBody);
		} else if (this._resultTransactionCode === TransactionErrorList.INSUFFICIENT_BALANCE) {
			throw new LowBalanceError(errorBody, errorBody);
		} else if (this._resultTransactionCode as keyof typeof TransactionErrorList) {
			throw new BadRequestError(errorBody);
		}

		throw new InternalError(errorBody);
	}

	translateHorizonError(errorCode: number, errorBody?: any) {
		if (this.includesObject(errorBody.type, [HorizonErrorList.RATE_LIMIT_EXCEEDED, HorizonErrorList.SERVER_OVER_CAPACITY, HorizonErrorList.TIMEOUT])) {
			throw new ServerError(errorBody);
		} else if (this.includesObject(errorBody.type, [HorizonErrorList.NOT_FOUND])) {
			throw new ResourceNotFoundError(errorBody);
		} else if (this.includesObject(errorBody.type, [HorizonErrorList.INTERNAL_SERVER_ERROR])) {
			throw new InternalError(errorBody);
		} else if (this.includesObject(errorBody.type, Object.values(HorizonErrorList))) {
			throw new BadRequestError(errorBody);
		}
		throw new InternalError(errorCode);
	}

	includesObject(type: string, list: string[]): boolean {
		for (let entry of list) {
			if (type.includes(entry)) {
				return true;
			}
		}
		return false;
	}
}

