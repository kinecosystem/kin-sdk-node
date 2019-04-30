export const HorizonErrorList = {
	BAD_REQUEST: 'bad_request', // cannot understand the request due to invalid parameters
	BEFORE_HISTORY: 'before_history', // outside the range of recorded history
	FORBIDDEN: 'forbidden', // not authorized to see
	NOT_ACCEPTABLE: 'not_acceptable', // cannot reply with the requested data format
	NOT_FOUND: 'not_found', // resource not found
	NOT_IMPLEMENTED: 'not_implemented', // request method is not supported
	RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded', // too many requests in a one hour time frame
	SERVER_OVER_CAPACITY: 'server_over_capacity', // server is currently overloaded
	STALE_HISTORY: 'stale_history', // historical request out of date than the configured threshold
	TIMEOUT: 'timeout', // request timed out before completing
	TRANSACTION_MALFORMED: 'transaction_malformed',
	TRANSACTION_FAILED: 'transaction_failed', // transaction well-formed but failed
	UNSUPPORTED_MEDIA_TYPE: 'unsupported_media_type', // unsupported content type
	INTERNAL_SERVER_ERROR: 'server_error'
};

export const TransactionErrorList = {
	FAILED: 'tx_failed', // one of the operations failed (none were applied)
	TOO_EARLY: 'tx_too_early', // ledger closeTime before minTime
	TOO_LATE: 'tx_too_late', // ledger closeTime after maxTime
	MISSING_OPERATION: 'tx_missing_operation', // no operation was specified
	BAD_SEQUENCE: 'tx_bad_seq', // sequence number does not match source account
	BAD_AUTH: 'tx_bad_auth', // too few valid signatures / wrong network
	INSUFFICIENT_BALANCE: 'tx_insufficient_balance', // fee would bring account below reserve
	NO_ACCOUNT: 'tx_no_source_account', // source account not found
	INSUFFICIENT_FEE: 'tx_insufficient_fee', // fee is too small
	BAD_AUTH_EXTRA: 'tx_bad_auth_extra', // unused signatures attached to transaction
	INTERNAL_ERROR: 'tx_internal_error' // an unknown error occurred
};

export const OperationResultCode = {
	INNER: 'op_inner',
	BAD_AUTH: 'op_bad_auth',
	NO_ACCOUNT: 'op_no_source_account',
	NOT_SUPPORTED: 'op_not_supported',
	SUCCESS: 'op_success'
};

export const CreateAccountResultCode = {
	SUCCESS: 'op_success', // account was created
	MALFORMED: 'op_malformed', // invalid destination account
	UNDERFUNDED: 'op_underfunded', // not enough funds in source account
	LOW_RESERVE: 'op_low_reserve', // would create an account below the min reserve
	ACCOUNT_EXISTS: 'op_already_exists' // account already exists
};

export const PaymentResultCode = {
	SUCCESS: 'op_success', // payment successfully completed
	MALFORMED: 'op_malformed', // bad input
	UNDERFUNDED: 'op_underfunded', // not enough funds in source account
	SRC_NO_TRUST: 'op_src_no_trust', // no trust line on source account
	SRC_NOT_AUTHORIZED: 'op_src_not_authorized', // source not authorized to transfer
	NO_DESTINATION: 'op_no_destination', // destination account does not exist
	NO_TRUST: 'op_no_trust', // destination missing a trust line for asset
	NOT_AUTHORIZED: 'op_not_authorized', // destination not authorized to hold asset
	LINE_FULL: 'op_line_full', // destination would go above their limit
	NO_ISSUER: 'op_no_issuer' // missing issuer on asset
};

export const ChangeTrustResultCode = {
	SUCCESS: 'op_success', // operation successful
	MALFORMED: 'op_malformed', // bad input
	NO_ISSUER: 'op_no_issuer', // could not find issuer
	LOW_RESERVE: 'op_low_reserve', // not enough funds to create a new trust line
	INVALID_LIMIT: 'op_invalid_limit' // cannot drop limit below balance, cannot create with a limit of 0
};

