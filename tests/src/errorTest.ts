import * as Error from "../../scripts/bin/errors";
import {AccountNotFoundError, BadRequestError} from "../../scripts/src/errors";


describe("Error", async () => {
	beforeAll(async () => {

	});

	test("Operations error", async () => {

		const obj = {
			"type": "https://stellar.org/horizon-errors/transaction_failed",
			"title": "Transaction Failed",
			"status": 400,
			"detail": "The transaction failed when submitted to the stellar network. The `extras.result_codes` field on this response contains further details.  Descriptions of each code can be found at: https://www.stellar.org/developers/learn/concepts/list-of-operations.html",
			"extras": {
				"envelope_xdr": "AAAAAK5k1V/ttpM83eWox5KIC46wnDnf+v4pZiBv3CtdRS0iAAAAZAAb9NgAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAEL0mlpzYxg56N51pY7zL6BmsgMKVeNO3iAB8gSay3w2AAAAAAADjX6kxPlgAAAAAAAAAAFdRS0iAAAAQBnMtjR93bD8bSNJxwBun30PCT+bm3X635e3rDiHufA0bd5q7hCsT+WIbH8iTVwuAp50fdRW4tPJgBdzQ9VZQgs=",
				"result_codes": {
					"transaction": "tx_failed",
					"operations": [
						"op_no_destination"
					]
				},
				"result_xdr": "AAAAAAAAAGT/////AAAAAQAAAAAAAAAB////+wAAAAA="
			}
		};
		expect(new Error.TransalteError(400, obj)).toEqual(new AccountNotFoundError(obj.extras.result_codes));
	});

	test("Horizon error", async () => {

		const obj = {
			"type": "https://stellar.org/horizon-errors/not_acceptable",
			"title": "An acceptable response content-type could not be provided for this request",
			"status": 406
		};
		expect(new Error.TransalteError(400, obj)).toEqual(new BadRequestError(obj.status));
	});

	test("Horizon error", async () => {

		const obj = {
			"type": "https://stellar.org/horizon-errors/transaction_failed",
			"title": "Transaction Failed",
			"status": 400,
			"detail": "The transaction failed when submitted to the stellar network. The `extras.result_codes` field on this response contains further details.  Descriptions of each code can be found at: https://www.stellar.org/developers/learn/concepts/list-of-operations.html",
			"extras": {
				"result_codes": {
					"transaction": "tx_bad_seq"
				},
				"result_xdr": "AAAAAAAAAAD////7AAAAAA=="
			}
		};
		expect(new Error.TransalteError(400, obj)).toEqual(new BadRequestError(400, obj));
	});


});
