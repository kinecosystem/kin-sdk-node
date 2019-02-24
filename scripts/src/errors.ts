export interface KinSdkError extends Error {
	readonly errorCode?: number;
}

export class AccountNotFoundError extends Error implements KinSdkError {

	readonly errorCode: number;

	constructor(readonly accountId: string) {
		super(`Account '${accountId}' was not found in the network.`)
		this.errorCode = 404;
	}
}

export class NetworkError extends Error implements KinSdkError {
}

export class ServerError extends Error implements KinSdkError {

	constructor(readonly errorCode: number) {
		super(`Server error, error code: ${errorCode}`)
		this.errorCode = errorCode;
	}
}