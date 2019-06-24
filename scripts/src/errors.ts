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
	| 'NetworkError'
	| 'ServerError'
	| 'FriendbotError'
	| 'InvalidAddressError'
	| 'ChannelBusyError'
	| 'NetworkMismatchedError'
	| 'InvalidDataError'
	| 'BadRequestError'
	| 'InternalError'
	| 'AccountExistsError'
	| 'LowBalanceError'
	| 'AccountNotActivatedError'
	| 'HorizonError'
	| 'ResourceNotFoundError';

export interface KinSdkError extends Error {
	readonly type: ErrorType;
}

export class HorizonError extends Error implements KinSdkError {
	readonly type: ErrorType = 'HorizonError';

	private readonly _resultTransactionCode?: string;
	private readonly _resultOperationsCode?: string[];
	readonly errorCode: number;

	constructor(readonly msg: string, readonly errorBody: ErrorResponse, readonly title?: string) {
		super(`${msg}, error code: ${errorBody.status} ` + ((title ? `title: ${errorBody.title}` : "")));
		this.errorCode = errorBody.status;
		this.errorBody = errorBody;
		this._resultTransactionCode = ErrorUtils.getTransaction(errorBody);
		this._resultOperationsCode = ErrorUtils.getOperations(errorBody);
	}

	public get resultTransactionCode(): string | undefined {
		return this._resultTransactionCode;
	}

	public get resultOperationsCode(): string[] | undefined {
		return this._resultOperationsCode;
	}
}

export class AccountNotFoundError extends HorizonError {

	readonly errorCode: number;
	readonly type: ErrorType = 'AccountNotFoundError';

	constructor(readonly errorBody: ErrorResponse, readonly title?: string) {
		super(`Account was not found in the network.`, errorBody, title);
		this.errorCode = 404;
	}
}

export class NetworkError extends Error implements KinSdkError {
	readonly type = 'NetworkError';

	constructor(readonly error: any) {
		super( error && error.message ? error.message : `Network error occurred`);
		this.error = error;
	}
}

export class NetworkMismatchedError extends Error implements KinSdkError {
	readonly type = 'NetworkMismatchedError';

	constructor() {
		super(`Unable to sign whitelist transaction, network type is mismatched`);
	}
}

export class InvalidDataError extends Error implements KinSdkError {
	readonly type = 'InvalidDataError';

	constructor() {
		super(`Unable to sign whitelist transaction, invalid data`);
	}
}

export class ServerError extends HorizonError {
	readonly type: ErrorType = 'ServerError';

	constructor(readonly errorBody: any) {
		super(`Server error`, errorBody);
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

export class BadRequestError extends HorizonError {
	readonly type: ErrorType = 'BadRequestError';

	constructor(readonly errorBody: ErrorResponse, readonly title?: string) {
		super(`Bad Request error`, errorBody, title);
	}
}

export class InternalError extends HorizonError {
	readonly type: ErrorType = 'InternalError';

	constructor(readonly errorBody: any, readonly title?: string) {
		super(`Internal error`, errorBody, title ? title : "{'internal_error': 'unknown horizon error'}");
	}
}

export class AccountExistsError extends HorizonError {
	readonly type: ErrorType = 'AccountExistsError';

	constructor(readonly errorBody: any, readonly title?: string) {
		super(`Account already exists`, errorBody, title);
	}
}

export class LowBalanceError extends HorizonError {
	readonly type: ErrorType = 'LowBalanceError';

	constructor(readonly errorBody: ErrorResponse, readonly title?: string) {
		super(`Low balance`, errorBody, title);
	}
}

export class AccountNotActivatedError extends HorizonError {
	readonly type: ErrorType = 'AccountNotActivatedError';

	constructor(readonly errorBody: ErrorResponse, readonly title?: string) {
		super(`Account not activated`, errorBody, title);
	}
}

export class ResourceNotFoundError extends HorizonError {
	readonly type: ErrorType = 'ResourceNotFoundError';

	constructor(readonly errorBody: ErrorResponse, readonly title?: string) {
		super(`Resources not found`, errorBody, title);
	}
}

export class ErrorDecoder {

	static translate(errorBody?: any): HorizonError | NetworkError{
		if (errorBody && errorBody.response) {
			errorBody = errorBody.response;
			if (errorBody.data) {
				errorBody = errorBody.data;
			}
			if (errorBody.type && errorBody.status) {
				// This is a Horizon error

				if (errorBody.type.includes(HorizonErrorList.TRANSACTION_FAILED)) {
					return this.translateTransactionError(errorBody.status, errorBody);
				} else {
					return this.translateHorizonError(errorBody.status, errorBody);
				}
			} else {
				return new InternalError(errorBody);
			}
		}

		return new NetworkError(errorBody);
	}

	static translateOperationError(errorCode: number, errorBody?: any): HorizonError {
		let resultCode;
		const resultOperationsCode = ErrorUtils.getOperations(errorBody);
		if (resultOperationsCode === undefined || !resultOperationsCode.length) {
			return new InternalError(errorBody);
		}

		for (let entry of resultOperationsCode) {
			if (entry !== OperationResultCode.SUCCESS) {
				resultCode = entry;
				break;
			}
		}
		if (!resultCode) {
			return new InternalError(errorBody);
		}
		if (this.includesObject(resultCode, [OperationResultCode.BAD_AUTH,
			CreateAccountResultCode.MALFORMED,
			PaymentResultCode.NO_ISSUER,
			PaymentResultCode.LINE_FULL,
			ChangeTrustResultCode.INVALID_LIMIT])) {
			return new BadRequestError(errorBody);
		} else if (this.includesObject(resultCode, [OperationResultCode.NO_ACCOUNT,
			PaymentResultCode.NO_DESTINATION])) {
			return new AccountNotFoundError(errorBody);
		} else if (resultCode === CreateAccountResultCode.ACCOUNT_EXISTS) {
			return new AccountExistsError(errorBody);
		} else if (this.includesObject(resultCode, [CreateAccountResultCode.LOW_RESERVE, PaymentResultCode.UNDERFUNDED])) {
			return new LowBalanceError(errorBody);
		} else if (this.includesObject(resultCode, [PaymentResultCode.SRC_NO_TRUST,
			PaymentResultCode.NO_TRUST,
			PaymentResultCode.SRC_NOT_AUTHORIZED,
			PaymentResultCode.NOT_AUTHORIZED])) {
			return new AccountNotActivatedError(errorBody);
		}

		return new InternalError(errorBody);
	}

	static translateTransactionError(errorCode: number, errorBody?: any): HorizonError {
		const resultTransactionCode = ErrorUtils.getTransaction(errorBody);
		if (resultTransactionCode === TransactionErrorList.FAILED) {
			return this.translateOperationError(errorCode, errorBody);
		} else if (resultTransactionCode === TransactionErrorList.NO_ACCOUNT) {
			return new AccountNotFoundError(errorBody);
		} else if (resultTransactionCode === TransactionErrorList.INSUFFICIENT_BALANCE) {
			return new LowBalanceError(errorBody);
		} else if (resultTransactionCode as keyof typeof TransactionErrorList) {
			return new BadRequestError(errorBody);
		}

		return new InternalError(errorBody);
	}

	static translateHorizonError(errorCode: number, errorBody?: any): HorizonError {
		if (this.includesObject(errorBody.type, [HorizonErrorList.RATE_LIMIT_EXCEEDED, HorizonErrorList.SERVER_OVER_CAPACITY, HorizonErrorList.TIMEOUT])) {
			return new ServerError(errorBody);
		} else if (this.includesObject(errorBody.type, [HorizonErrorList.NOT_FOUND])) {
			return new ResourceNotFoundError(errorBody);
		} else if (this.includesObject(errorBody.type, [HorizonErrorList.INTERNAL_SERVER_ERROR])) {
			return new InternalError(errorBody);
		} else if (this.includesObject(errorBody.type, Object.values(HorizonErrorList))) {
			return new BadRequestError(errorBody);
		}
		return new InternalError(errorCode);
	}

	static includesObject(type: string, list: string[]): boolean {
		for (let entry of list) {
			if (type.includes(entry)) {
				return true;
			}
		}
		return false;
	}
}

