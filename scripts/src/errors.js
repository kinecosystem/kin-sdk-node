"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("./blockchain/errors");
class ErrorUtils {
    static getTransaction(errorBody) {
        if (errorBody && errorBody.extras && errorBody.extras.result_codes.transaction) {
            return errorBody.extras.result_codes.transaction;
        }
        return undefined;
    }
    static getOperations(errorBody) {
        if (errorBody && errorBody.extras && errorBody.extras.result_codes.operations) {
            return errorBody.extras.result_codes.operations;
        }
        return undefined;
    }
}
class HorizonError extends Error {
    constructor(msg, errorBody, title) {
        super(`${msg}, error code: ${errorBody.status} ` + ((title ? `title: ${errorBody.title}` : "")));
        this.msg = msg;
        this.errorBody = errorBody;
        this.title = title;
        this.type = 'HorizonError';
        this.errorCode = errorBody.status;
        this.errorBody = errorBody;
        this._resultTransactionCode = ErrorUtils.getTransaction(errorBody);
        this._resultOperationsCode = ErrorUtils.getOperations(errorBody);
    }
    get resultTransactionCode() {
        return this._resultTransactionCode;
    }
    get resultOperationsCode() {
        return this._resultOperationsCode;
    }
}
exports.HorizonError = HorizonError;
class AccountNotFoundError extends Error {
    constructor(accountId) {
        super(`Account '${accountId}' was not found in the network.`);
        this.accountId = accountId;
        this.type = 'AccountNotFoundError';
        this.errorCode = 404;
    }
}
exports.AccountNotFoundError = AccountNotFoundError;
class TransactionNotFoundError extends Error {
    constructor(transactionId) {
        super(`Transaction '${transactionId}' was not found in the network.`);
        this.transactionId = transactionId;
        this.type = 'TransactionNotFoundError';
        this.errorCode = 404;
    }
}
exports.TransactionNotFoundError = TransactionNotFoundError;
class NetworkError extends Error {
    constructor() {
        super(...arguments);
        this.type = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
class NetworkMismatchedError extends Error {
    constructor() {
        super(`Unable to sign whitelist transaction, network type is mismatched`);
        this.type = 'NetworkMismatchedError';
    }
}
exports.NetworkMismatchedError = NetworkMismatchedError;
class InvalidDataError extends Error {
    constructor() {
        super(`Unable to sign whitelist transaction, invalid data`);
        this.type = 'InvalidDataError';
    }
}
exports.InvalidDataError = InvalidDataError;
class ServerError extends HorizonError {
    constructor(errorBody) {
        super(`Server error`, errorBody);
        this.errorBody = errorBody;
        this.type = 'ServerError';
    }
}
exports.ServerError = ServerError;
class TransactionFailedError extends HorizonError {
    constructor(errorBody, title) {
        super(`Transaction failed error`, errorBody, title);
        this.errorBody = errorBody;
        this.title = title;
        this.type = 'TransactionFailedError';
    }
}
exports.TransactionFailedError = TransactionFailedError;
class FriendbotError extends Error {
    constructor(errorCode, extra, msg) {
        super(`Friendbot error, ` + (errorCode ? `error code: ${errorCode} ` : "") + (msg ? `msg: ${msg}` : ""));
        this.errorCode = errorCode;
        this.extra = extra;
        this.msg = msg;
        this.type = 'FriendbotError';
        this.errorCode = errorCode;
        this.extra = extra;
    }
}
exports.FriendbotError = FriendbotError;
class InvalidAddressError extends Error {
    constructor() {
        super('Invalid wallet address.');
        this.type = 'InvalidAddressError';
    }
}
exports.InvalidAddressError = InvalidAddressError;
class ChannelBusyError extends Error {
    constructor() {
        super('Cannot acquire a free channel.');
        this.type = 'ChannelBusyError';
    }
}
exports.ChannelBusyError = ChannelBusyError;
class BadRequestError extends HorizonError {
    constructor(errorBody, title) {
        super(`Bad Request error`, errorBody, title);
        this.errorBody = errorBody;
        this.title = title;
        this.type = 'BadRequestError';
    }
}
exports.BadRequestError = BadRequestError;
class InternalError extends HorizonError {
    constructor(errorBody, title) {
        super(`internal error`, errorBody, title ? title : "{'internal_error': 'unknown horizon error'}");
        this.errorBody = errorBody;
        this.title = title;
        this.type = 'InternalError';
    }
}
exports.InternalError = InternalError;
class AccountExistsError extends HorizonError {
    constructor(errorBody, title) {
        super(`account already exists`, errorBody, title);
        this.errorBody = errorBody;
        this.title = title;
        this.type = 'AccountExists';
    }
}
exports.AccountExistsError = AccountExistsError;
class LowBalanceError extends HorizonError {
    constructor(errorBody, title) {
        super(`low balance`, errorBody, title);
        this.errorBody = errorBody;
        this.title = title;
        this.type = 'LowBalanceError';
    }
}
exports.LowBalanceError = LowBalanceError;
class AccountNotActivatedError extends HorizonError {
    constructor(errorBody, title) {
        super(`account not activated`, errorBody, title);
        this.errorBody = errorBody;
        this.title = title;
        this.type = 'AccountNotActivatedError';
    }
}
exports.AccountNotActivatedError = AccountNotActivatedError;
class ResourceNotFoundError extends HorizonError {
    constructor(errorBody, title) {
        super(`resources not found`, errorBody, title);
        this.errorBody = errorBody;
        this.title = title;
        this.type = 'ResourceNotFoundError';
    }
}
exports.ResourceNotFoundError = ResourceNotFoundError;
class TranslateError {
    constructor(errorBody) {
        this.errorBody = errorBody;
        if (errorBody && errorBody.response) {
            errorBody = errorBody.response;
            if (errorBody.data) {
                errorBody = errorBody.data;
            }
            if (errorBody.type && errorBody.status) {
                this._resultTransactionCode = ErrorUtils.getTransaction(errorBody);
                this._resultOperationsCode = ErrorUtils.getOperations(errorBody);
                if (errorBody.type.includes(errors_1.HorizonErrorList.TRANSACTION_FAILED)) {
                    this.translateTransactionError(errorBody.status, errorBody);
                }
                else {
                    this.translateHorizonError(errorBody.status, errorBody);
                }
            }
            else {
                throw new InternalError(errorBody);
            }
        }
        else {
            throw new NetworkError();
        }
    }
    translateOperationError(errorCode, errorBody) {
        let resultCode;
        if (this._resultOperationsCode === undefined || this._resultOperationsCode.length === 0) {
            throw new InternalError(errorBody);
        }
        for (let entry of this._resultOperationsCode) {
            if (entry !== errors_1.OperationResultCode.SUCCESS) {
                resultCode = entry;
                break;
            }
        }
        if (!resultCode) {
            throw new InternalError(errorBody);
        }
        if (this.includesObject(resultCode, [errors_1.OperationResultCode.BAD_AUTH,
            errors_1.CreateAccountResultCode.MALFORMED,
            errors_1.PaymentResultCode.NO_ISSUER,
            errors_1.PaymentResultCode.LINE_FULL,
            errors_1.ChangeTrustResultCode.INVALID_LIMIT])) {
            throw new BadRequestError(errorBody);
        }
        else if (this.includesObject(resultCode, [errors_1.OperationResultCode.NO_ACCOUNT,
            errors_1.PaymentResultCode.NO_DESTINATION])) {
            throw new AccountNotFoundError();
        }
        else if (resultCode === errors_1.CreateAccountResultCode.ACCOUNT_EXISTS) {
            throw new AccountExistsError(errorCode, errorBody);
        }
        else if (this.includesObject(resultCode, [errors_1.CreateAccountResultCode.LOW_RESERVE, errors_1.PaymentResultCode.UNDERFUNDED])) {
            throw new LowBalanceError(errorBody);
        }
        else if (this.includesObject(resultCode, [errors_1.PaymentResultCode.SRC_NO_TRUST,
            errors_1.PaymentResultCode.NO_TRUST,
            errors_1.PaymentResultCode.SRC_NOT_AUTHORIZED,
            errors_1.PaymentResultCode.NOT_AUTHORIZED])) {
            throw new AccountNotActivatedError(errorBody);
        }
        throw new InternalError(errorBody);
    }
    translateTransactionError(errorCode, errorBody) {
        if (this._resultTransactionCode === errors_1.TransactionErrorList.FAILED) {
            this.translateOperationError(errorCode, errorBody);
        }
        else if (this._resultTransactionCode === errors_1.TransactionErrorList.NO_ACCOUNT) {
            throw new AccountNotFoundError(errorBody);
        }
        else if (this._resultTransactionCode === errors_1.TransactionErrorList.INSUFFICIENT_BALANCE) {
            throw new LowBalanceError(errorBody, errorBody);
        }
        else if (this._resultTransactionCode) {
            throw new BadRequestError(errorBody);
        }
        throw new InternalError(errorBody);
    }
    translateHorizonError(errorCode, errorBody) {
        if (this.includesObject(errorBody.type, [errors_1.HorizonErrorList.RATE_LIMIT_EXCEEDED, errors_1.HorizonErrorList.SERVER_OVER_CAPACITY, errors_1.HorizonErrorList.TIMEOUT])) {
            throw new ServerError(errorBody);
        }
        else if (this.includesObject(errorBody.type, [errors_1.HorizonErrorList.NOT_FOUND])) {
            throw new ResourceNotFoundError(errorBody);
        }
        else if (this.includesObject(errorBody.type, [errors_1.HorizonErrorList.INTERNAL_SERVER_ERROR])) {
            throw new InternalError(errorBody);
        }
        else if (this.includesObject(errorBody.type, Object.values(errors_1.HorizonErrorList))) {
            throw new BadRequestError(errorBody);
        }
        throw new InternalError(errorCode);
    }
    includesObject(type, list) {
        for (let entry of list) {
            if (type.includes(entry)) {
                return true;
            }
        }
        return false;
    }
}
exports.TranslateError = TranslateError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsZ0RBTzZCO0FBRTdCLE1BQU0sVUFBVTtJQUNmLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBYztRQUNuQyxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRTtZQUMvRSxPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQztTQUNqRDtRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7SUFFRCxNQUFNLENBQUMsYUFBYSxDQUFDLFNBQWM7UUFDbEMsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUU7WUFDOUUsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUM7U0FDaEQ7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDO0NBQ0Q7QUFrQ0QsTUFBYSxZQUFhLFNBQVEsS0FBSztJQU90QyxZQUFxQixHQUFXLEVBQVcsU0FBd0IsRUFBVyxLQUFjO1FBQzNGLEtBQUssQ0FBQyxHQUFHLEdBQUcsaUJBQWlCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxVQUFVLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRDdFLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFBVyxjQUFTLEdBQVQsU0FBUyxDQUFlO1FBQVcsVUFBSyxHQUFMLEtBQUssQ0FBUztRQU5uRixTQUFJLEdBQWMsY0FBYyxDQUFDO1FBUXpDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztRQUNsQyxJ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