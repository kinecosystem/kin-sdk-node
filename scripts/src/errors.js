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
        this.resultTransactionCode = ErrorUtils.getTransaction(errorBody);
        this.resultOperationsCode = ErrorUtils.getOperations(errorBody);
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
class InvalidAddress extends Error {
    constructor() {
        super('invalid wallet address.');
        this.type = 'InvalidAddress';
    }
}
exports.InvalidAddress = InvalidAddress;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsZ0RBTzZCO0FBRTdCLE1BQU0sVUFBVTtJQUNmLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBYztRQUNuQyxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRTtZQUMvRSxPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQztTQUNqRDtRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7SUFFRCxNQUFNLENBQUMsYUFBYSxDQUFDLFNBQWM7UUFDbEMsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUU7WUFDOUUsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUM7U0FDaEQ7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDO0NBQ0Q7QUFpQ0QsTUFBYSxZQUFhLFNBQVEsS0FBSztJQU90QyxZQUFxQixHQUFXLEVBQVcsU0FBd0IsRUFBVyxLQUFjO1FBQzNGLEtBQUssQ0FBQyxHQUFHLEdBQUcsaUJBQWlCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxVQUFVLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRDdFLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFBVyxjQUFTLEdBQVQsU0FBUyxDQUFlO1FBQVcsVUFBSyxHQUFMLEtBQUssQ0FBUztRQU5uRixTQUFJLEdBQWMsY0FBYyxDQUFDO1FBUXpDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztRQUNsQyxJ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