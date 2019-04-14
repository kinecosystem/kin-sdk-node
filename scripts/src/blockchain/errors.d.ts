export declare const HorizonErrorList: {
    BAD_REQUEST: string;
    BEFORE_HISTORY: string;
    FORBIDDEN: string;
    NOT_ACCEPTABLE: string;
    NOT_FOUND: string;
    NOT_IMPLEMENTED: string;
    RATE_LIMIT_EXCEEDED: string;
    SERVER_OVER_CAPACITY: string;
    STALE_HISTORY: string;
    TIMEOUT: string;
    TRANSACTION_MALFORMED: string;
    TRANSACTION_FAILED: string;
    UNSUPPORTED_MEDIA_TYPE: string;
    INTERNAL_SERVER_ERROR: string;
};
export declare const TransactionErrorList: {
    FAILED: string;
    TOO_EARLY: string;
    TOO_LATE: string;
    MISSING_OPERATION: string;
    BAD_SEQUENCE: string;
    BAD_AUTH: string;
    INSUFFICIENT_BALANCE: string;
    NO_ACCOUNT: string;
    INSUFFICIENT_FEE: string;
    BAD_AUTH_EXTRA: string;
    INTERNAL_ERROR: string;
};
export declare const OperationResultCode: {
    INNER: string;
    BAD_AUTH: string;
    NO_ACCOUNT: string;
    NOT_SUPPORTED: string;
    SUCCESS: string;
};
export declare const CreateAccountResultCode: {
    SUCCESS: string;
    MALFORMED: string;
    UNDERFUNDED: string;
    LOW_RESERVE: string;
    ACCOUNT_EXISTS: string;
};
export declare const PaymentResultCode: {
    SUCCESS: string;
    MALFORMED: string;
    UNDERFUNDED: string;
    SRC_NO_TRUST: string;
    SRC_NOT_AUTHORIZED: string;
    NO_DESTINATION: string;
    NO_TRUST: string;
    NOT_AUTHORIZED: string;
    LINE_FULL: string;
    NO_ISSUER: string;
};
export declare const ChangeTrustResultCode: {
    SUCCESS: string;
    MALFORMED: string;
    NO_ISSUER: string;
    LOW_RESERVE: string;
    INVALID_LIMIT: string;
};
