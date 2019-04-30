import * as Error from "../../scripts/src/errors";
import {
	AccountExistsError,
	AccountNotActivatedError,
	AccountNotFoundError,
	BadRequestError,
	InternalError,
	LowBalanceError,
	NetworkError,
	ResourceNotFoundError,
	ServerError
} from "../../scripts/src/errors";
import each from "jest-each";
import {
	ChangeTrustResultCode,
	CreateAccountResultCode,
	HorizonErrorList,
	OperationResultCode,
	PaymentResultCode,
	TransactionErrorList
} from "../../scripts/src/blockchain/errors";


describe("Error", async () => {
	beforeAll(async () => {

	});

	test("Horizon error", async () => {

		const obj = {
			response: {
				"type": "https://stellar.org/horizon-errors/not_acceptable",
				"title": "An acceptable response content-type could not be provided for this request",
				"status": 406
			}
		};

		expect(Error.ErrorDecoder.translate(obj)).toEqual(new BadRequestError(obj.response));
	});

	test("Network error", async () => {
		const obj = {};

		expect(Error.ErrorDecoder.translate(obj)).toEqual(new NetworkError(obj));
	});

	each([[HorizonErrorList.RATE_LIMIT_EXCEEDED, ServerError],
		[HorizonErrorList.SERVER_OVER_CAPACITY, ServerError],
		[HorizonErrorList.TIMEOUT, ServerError],
		[HorizonErrorList.NOT_FOUND, ResourceNotFoundError],
		[HorizonErrorList.INTERNAL_SERVER_ERROR, InternalError],
		[HorizonErrorList.BAD_REQUEST, BadRequestError],
		[HorizonErrorList.BEFORE_HISTORY, BadRequestError],
		[HorizonErrorList.FORBIDDEN, BadRequestError],
		[HorizonErrorList.NOT_ACCEPTABLE, BadRequestError],
		[HorizonErrorList.NOT_IMPLEMENTED, BadRequestError],
		[HorizonErrorList.STALE_HISTORY, BadRequestError],
		[HorizonErrorList.TRANSACTION_MALFORMED, BadRequestError],
		[HorizonErrorList.UNSUPPORTED_MEDIA_TYPE, BadRequestError]]).test(
		'returns the result of adding %d to %d',
		(errorName, expected) => {
			let res = new expected(horizonResponse(errorName).response);
			expect(Error.ErrorDecoder.translate(horizonResponse(errorName))).toEqual(res);
		},
	);

	function horizonResponse(horizon: string) {
		const response = {
			response: {
				"type": `https://stellar.org/horizon-errors/${horizon}`,
				"title": "An acceptable response content-type could not be provided for this request",
				"status": 406
			}
		};
		return response;
	}

	each([[TransactionErrorList.TOO_EARLY, BadRequestError],
		[TransactionErrorList.TOO_LATE, BadRequestError],
		[TransactionErrorList.MISSING_OPERATION, BadRequestError],
		[TransactionErrorList.BAD_SEQUENCE, BadRequestError],
		[TransactionErrorList.BAD_AUTH, BadRequestError],
		[TransactionErrorList.INSUFFICIENT_BALANCE, LowBalanceError],
		[TransactionErrorList.NO_ACCOUNT, AccountNotFoundError],
		[TransactionErrorList.INSUFFICIENT_FEE, BadRequestError],
		[TransactionErrorList.BAD_AUTH_EXTRA, BadRequestError],
		[TransactionErrorList.INTERNAL_ERROR, BadRequestError]]).test(
		'returns the result of adding %d to %d',
		(errorName, expected) => {
			let res = new expected(translateResponse(errorName).response);
			expect(Error.ErrorDecoder.translate(translateResponse(errorName))).toEqual(res);
		},
	);

	function translateResponse(transaction: string) {
		const response = {
			response: {
				"type": "https://stellar.org/horizon-errors/transaction_failed",
				"title": "Transaction Failed",
				"status": 400,
				"detail": "The transaction failed when submitted to the stellar network. The `extras.result_codes` field on this response contains further details.  " +
					"Descriptions of each code can be found at: https://www.stellar.org/developers/learn/concepts/list-of-operations.html",
				"extras": {
					"result_codes": {
						"transaction": `${transaction}`
					},
					"result_xdr": "AAAAAAAAAAD////7AAAAAA=="
				}
			}
		};
		return response;
	}

	each([[OperationResultCode.BAD_AUTH, BadRequestError],
		[CreateAccountResultCode.MALFORMED, BadRequestError],
		[PaymentResultCode.NO_ISSUER, BadRequestError],
		[PaymentResultCode.LINE_FULL, BadRequestError],
		[ChangeTrustResultCode.INVALID_LIMIT, BadRequestError],
		[OperationResultCode.NO_ACCOUNT, AccountNotFoundError],
		[PaymentResultCode.NO_DESTINATION, AccountNotFoundError],
		[CreateAccountResultCode.ACCOUNT_EXISTS, AccountExistsError],
		[CreateAccountResultCode.LOW_RESERVE, LowBalanceError],
		[PaymentResultCode.UNDERFUNDED, LowBalanceError],
		[PaymentResultCode.SRC_NO_TRUST, AccountNotActivatedError],
		[PaymentResultCode.NO_TRUST, AccountNotActivatedError],
		[PaymentResultCode.SRC_NOT_AUTHORIZED, AccountNotActivatedError],
		[PaymentResultCode.NOT_AUTHORIZED, AccountNotActivatedError]]).test(
		'returns the result of adding %d to %d',
		(errorName, expected) => {
			let res = new expected(operationsRespons(errorName).response);
			expect(Error.ErrorDecoder.translate(operationsRespons(errorName))).toEqual(res);
		},
	);

	function operationsRespons(operation: string) {
		const response = {
			response: {
				"type": "https://stellar.org/horizon-errors/transaction_failed",
				"title": "Transaction Failed",
				"status": 400,
				"detail": "The transaction failed when submitted to the stellar network. The `extras.result_codes` field on this response contains further details.  " +
					"Descriptions of each code can be found at: https://www.stellar.org/developers/learn/concepts/list-of-operations.html",
				"extras": {
					"envelope_xdr": "AAAAAK5k1V/ttpM83eWox5KIC46wnDnf+v4pZiBv3CtdRS0iAAAAZAAb9NgAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAEL0mlpzYxg56N51" +
						"pY7zL6BmsgMKVeNO3iAB8gSay3w2AAAAAAADjX6kxPlgAAAAAAAAAAFdRS0iAAAAQBnMtjR93bD8bSNJxwBun30PCT+bm3X635e3rDiHufA0bd5q7hCsT+WIbH8iTVwuAp50fdRW4tPJgBdzQ9VZQgs=",
					"result_codes": {
						"transaction": "tx_failed",
						"operations": [
							`${operation}`
						]
					},
					"result_xdr": "AAAAAAAAAGT/////AAAAAQAAAAAAAAAB////+wAAAAA="
				}
			}
		};
		return response;
	}
});
