import {TransactionRetriever} from "../../scripts/src/blockchain/transactionRetriever";
import * as nock from "nock";
import {CreateAccountTransaction, PaymentTransaction, RawTransaction} from "../../scripts/src/blockchain/horizonModels";
import {ErrorResponse, InternalError, NetworkError, ResourceNotFoundError} from "../../scripts/src/errors";
import {Memo, Operation} from "@kinecosystem/kin-base";
import {Server} from "@kinecosystem/kin-sdk";

// as a workaround, TransactionRetriever was separated to two files due to some jest error when running both fetchTransactionHistory
// and fetchTransaction tests in the same file

const fakeUrl = "http://horizon.com";
let transactionRetriever: TransactionRetriever;

describe("TransactionRetriever.fetchTransactionHistory", async () => {
	beforeAll(async () => {
		transactionRetriever = new TransactionRetriever(new Server(fakeUrl, {allowHttp: true}));
	});

	const transactionListResponse = {
		"_links": {
			"self": {
				"href": "https://horizon-testnet.kininfrastructure.com/accounts/GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR/transactions?cursor=&limit=10&order=desc"
			},
			"next": {
				"href": "https://horizon-testnet.kininfrastructure.com/accounts/GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR/transactions?cursor=5590101799211008&limit=10&order=desc"
			},
			"prev": {
				"href": "https://horizon-testnet.kininfrastructure.com/accounts/GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR/transactions?cursor=5610472829095936&limit=10&order=asc"
			}
		},
		"_embedded": {
			"records": [
				{
					"_links": {
						"self": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/abf994663197b93483ee7e24e05faf30278e9208362ddb1d0ab2bcd29b3e1ded"
						},
						"account": {
							"href": "https://horizon-testnet.kininfrastructure.com/accounts/GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR"
						},
						"ledger": {
							"href": "https://horizon-testnet.kininfrastructure.com/ledgers/1306290"
						},
						"operations": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/abf994663197b93483ee7e24e05faf30278e9208362ddb1d0ab2bcd29b3e1ded/operations{?cursor,limit,order}",
							"templated": true
						},
						"effects": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/abf994663197b93483ee7e24e05faf30278e9208362ddb1d0ab2bcd29b3e1ded/effects{?cursor,limit,order}",
							"templated": true
						},
						"precedes": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions?order=asc&cursor=5610472829095936"
						},
						"succeeds": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions?order=desc&cursor=5610472829095936"
						}
					},
					"id": "abf994663197b93483ee7e24e05faf30278e9208362ddb1d0ab2bcd29b3e1ded",
					"paging_token": "5610472829095936",
					"hash": "abf994663197b93483ee7e24e05faf30278e9208362ddb1d0ab2bcd29b3e1ded",
					"ledger": 1306290,
					"created_at": "2019-03-04T06:59:39Z",
					"source_account": "GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR",
					"source_account_sequence": "5590101799206914",
					"fee_paid": 122,
					"operation_count": 1,
					"envelope_xdr": "AAAAAD3mWWEIbVHDJXjZl6aOHSjsrNR4rsfH52zMe/64AzGuAAAAegAT3CsAAAACAAAAAQAAAABcfMx1AAAAAFx9bE0AAAAAAAAAAQAAAAAAAAABAAAAAO+N4sm40C1ZzR+tVcPtfyuQZ8xIg8G29LN0ZZjbqrWbAAAAAAAAAAAAADA5AAAAAAAAAAG4AzGuAAAAQF8+8552GljKa9Dhp4KafXtHWKk/RfOCTf9uo/BSMwO6P/BgkiSJQYlWuzWgRAaOp+hhmAMaAIQTHDGse6upkwg=",
					"result_xdr": "AAAAAAAAAHoAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAEAAAAEAAAAAwAT7rIAAAAAAAAAAD3mWWEIbVHDJXjZl6aOHSjsrNR4rsfH52zMe/64AzGuAAAAADuISNcAE9wrAAAAAgAAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAT7rIAAAAAAAAAAD3mWWEIbVHDJXjZl6aOHSjsrNR4rsfH52zMe/64AzGuAAAAADuIGJ4AE9wrAAAAAgAAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAT3DsAAAAAAAAAAO+N4sm40C1ZzR+tVcPtfyuQZ8xIg8G29LN0ZZjbqrWbAAAAAAASf7kAE9w7AAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAT7rIAAAAAAAAAAO+N4sm40C1ZzR+tVcPtfyuQZ8xIg8G29LN0ZZjbqrWbAAAAAAASr/IAE9w7AAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA",
					"fee_meta_xdr": "AAAAAgAAAAMAE9w7AAAAAAAAAAA95llhCG1RwyV42Zemjh0o7KzUeK7Hx+dszHv+uAMxrgAAAAA7iElRABPcKwAAAAEAAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAEAE+6yAAAAAAAAAAA95llhCG1RwyV42Zemjh0o7KzUeK7Hx+dszHv+uAMxrgAAAAA7iEjXABPcKwAAAAIAAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAA==",
					"memo_type": "none",
					"signatures": [
						"Xz7znnYaWMpr0OGngpp9e0dYqT9F84JN/26j8FIzA7o/8GCSJIlBiVa7NaBEBo6n6GGYAxoAhBMcMax7q6mTCA=="
					],
					"valid_after": "2019-03-04T06:57:57Z",
					"valid_before": "2019-03-04T18:19:57Z"
				},
				{
					"_links": {
						"self": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/21e71521c34bc9a7981edaff3c87f32f989b8489195bd6797f2040ab7a604c70"
						},
						"account": {
							"href": "https://horizon-testnet.kininfrastructure.com/accounts/GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR"
						},
						"ledger": {
							"href": "https://horizon-testnet.kininfrastructure.com/ledgers/1301563"
						},
						"operations": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/21e71521c34bc9a7981edaff3c87f32f989b8489195bd6797f2040ab7a604c70/operations{?cursor,limit,order}",
							"templated": true
						},
						"effects": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/21e71521c34bc9a7981edaff3c87f32f989b8489195bd6797f2040ab7a604c70/effects{?cursor,limit,order}",
							"templated": true
						},
						"precedes": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions?order=asc&cursor=5590170518687744"
						},
						"succeeds": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions?order=desc&cursor=5590170518687744"
						}
					},
					"id": "21e71521c34bc9a7981edaff3c87f32f989b8489195bd6797f2040ab7a604c70",
					"paging_token": "5590170518687744",
					"hash": "21e71521c34bc9a7981edaff3c87f32f989b8489195bd6797f2040ab7a604c70",
					"ledger": 1301563,
					"created_at": "2019-03-03T18:23:59Z",
					"source_account": "GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR",
					"source_account_sequence": "5590101799206913",
					"fee_paid": 246,
					"operation_count": 2,
					"envelope_xdr": "AAAAAD3mWWEIbVHDJXjZl6aOHSjsrNR4rsfH52zMe/64AzGuAAAA9gAT3CsAAAABAAAAAQAAAABcfBrNAAAAAFx9bE0AAAAAAAAAAgAAAAAAAAAAAAAAAO+N4sm40C1ZzR+tVcPtfyuQZ8xIg8G29LN0ZZjbqrWbAAAAAAASf7kAAAAAAAAACgAAAAR0ZXN0AAAAAQAAAAV2YWx1ZQAAAAAAAAAAAAABuAMxrgAAAEAvuA5INudqAHPSrCnhmZGoOWkISqYCIPQfq2F9Ty/3U+kRD7ulI1NFolfU+QBu7rV+LIJF8Bjg0l+iM2zoFTgC",
					"result_xdr": "AAAAAAAAAPYAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAIAAAADAAAAAAAT3DsAAAAAAAAAAO+N4sm40C1ZzR+tVcPtfyuQZ8xIg8G29LN0ZZjbqrWbAAAAAAASf7kAE9w7AAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAT3DsAAAAAAAAAAD3mWWEIbVHDJXjZl6aOHSjsrNR4rsfH52zMe/64AzGuAAAAADuayQoAE9wrAAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAT3DsAAAAAAAAAAD3mWWEIbVHDJXjZl6aOHSjsrNR4rsfH52zMe/64AzGuAAAAADuISVEAE9wrAAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAE9w7AAAAAwAAAAA95llhCG1RwyV42Zemjh0o7KzUeK7Hx+dszHv+uAMxrgAAAAR0ZXN0AAAABXZhbHVlAAAAAAAAAAAAAAAAAAADABPcOwAAAAAAAAAAPeZZYQhtUcMleNmXpo4dKOys1Hiux8fnbMx7/rgDMa4AAAAAO4hJUQAT3CsAAAABAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAABABPcOwAAAAAAAAAAPeZZYQhtUcMleNmXpo4dKOys1Hiux8fnbMx7/rgDMa4AAAAAO4hJUQAT3CsAAAABAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAA=",
					"fee_meta_xdr": "AAAAAgAAAAMAE9wrAAAAAAAAAAA95llhCG1RwyV42Zemjh0o7KzUeK7Hx+dszHv+uAMxrgAAAAA7msoAABPcKwAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAEAE9w7AAAAAAAAAAA95llhCG1RwyV42Zemjh0o7KzUeK7Hx+dszHv+uAMxrgAAAAA7mskKABPcKwAAAAEAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAA==",
					"memo_type": "none",
					"signatures": [
						"L7gOSDbnagBz0qwp4ZmRqDlpCEqmAiD0H6thfU8v91PpEQ+7pSNTRaJX1PkAbu61fiyCRfAY4NJfojNs6BU4Ag=="
					],
					"valid_after": "2019-03-03T18:19:57Z",
					"valid_before": "2019-03-04T18:19:57Z"
				},
				{
					"_links": {
						"self": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/c8b8c11b4ef521dfce4b673754ec43860e321ff608985289b944ccff7a427316"
						},
						"account": {
							"href": "https://horizon-testnet.kininfrastructure.com/accounts/GDHCB4VCNNFIMZI3BVHLA2FVASECBR2ZXHOAXEBBFVUH5G2YAD7V3JVH"
						},
						"ledger": {
							"href": "https://horizon-testnet.kininfrastructure.com/ledgers/1301547"
						},
						"operations": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/c8b8c11b4ef521dfce4b673754ec43860e321ff608985289b944ccff7a427316/operations{?cursor,limit,order}",
							"templated": true
						},
						"effects": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/c8b8c11b4ef521dfce4b673754ec43860e321ff608985289b944ccff7a427316/effects{?cursor,limit,order}",
							"templated": true
						},
						"precedes": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions?order=asc&cursor=5590101799211008"
						},
						"succeeds": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions?order=desc&cursor=5590101799211008"
						}
					},
					"id": "c8b8c11b4ef521dfce4b673754ec43860e321ff608985289b944ccff7a427316",
					"paging_token": "5590101799211008",
					"hash": "c8b8c11b4ef521dfce4b673754ec43860e321ff608985289b944ccff7a427316",
					"ledger": 1301547,
					"created_at": "2019-03-03T18:22:39Z",
					"source_account": "GDHCB4VCNNFIMZI3BVHLA2FVASECBR2ZXHOAXEBBFVUH5G2YAD7V3JVH",
					"source_account_sequence": "1728",
					"fee_paid": 100,
					"operation_count": 1,
					"envelope_xdr": "AAAAAM4g8qJrSoZlGw1OsGi1BIggx1m53AuQIS1ofptYAP9dAAAAZAAAAAAAAAbAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAPeZZYQhtUcMleNmXpo4dKOys1Hiux8fnbMx7/rgDMa4AAAAAO5rKAAAAAAAAAAABWAD/XQAAAEDuy2SYWiLc8qZ4wQ5LC8l7G56DXTuszj3saeOO9ndWbD4yRiW2nYUqAEJ7tA9n7bCX/0saThfQecZbF/JIqKMP",
					"result_xdr": "AAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAAT3CsAAAAAAAAAAD3mWWEIbVHDJXjZl6aOHSjsrNR4rsfH52zMe/64AzGuAAAAADuaygAAE9wrAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAT3CsAAAAAAAAAAM4g8qJrSoZlGw1OsGi1BIggx1m53AuQIS1ofptYAP9dDeCj+Q4WpOcAAAAAAAAGwAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAT3CsAAAAAAAAAAM4g8qJrSoZlGw1OsGi1BIggx1m53AuQIS1ofptYAP9dDeCj+NJ72ucAAAAAAAAGwAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA",
					"fee_meta_xdr": "AAAAAgAAAAMAE9E/AAAAAAAAAADOIPKia0qGZRsNTrBotQSIIMdZudwLkCEtaH6bWAD/XQ3go/kOFqTnAAAAAAAABr8AAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAEAE9wrAAAAAAAAAADOIPKia0qGZRsNTrBotQSIIMdZudwLkCEtaH6bWAD/XQ3go/kOFqTnAAAAAAAABsAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAA==",
					"memo_type": "none",
					"signatures": [
						"7stkmFoi3PKmeMEOSwvJexueg107rM497GnjjvZ3Vmw+MkYltp2FKgBCe7QPZ+2wl/9LGk4X0HnGWxfySKijDw=="
					]
				}
			]
		}
	};

	test("transactions exists, should return transactions list", async () => {
		const address = "GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR";
		nock(fakeUrl)
			.get(uri => uri.includes(address))
			.reply(200, transactionListResponse);
		const transactions = await transactionRetriever.fetchTransactionHistory({address: "GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR",});
		expect(transactions).toHaveLength(3);

		const paymentTx = transactions[0] as PaymentTransaction;
		expect(paymentTx.source).toEqual('GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR');
		expect(paymentTx.fee).toEqual(122);
		expect(paymentTx.destination).toEqual('GDXY3YWJXDIC2WOND6WVLQ7NP4VZAZ6MJCB4DNXUWN2GLGG3VK2ZX5TB');
		expect(paymentTx.amount).toEqual(0.12345);
		expect(paymentTx.memo).toBeUndefined();
		expect(paymentTx.sequence).toEqual(5590101799206914);
		expect(paymentTx.hash).toEqual('abf994663197b93483ee7e24e05faf30278e9208362ddb1d0ab2bcd29b3e1ded');
		expect(paymentTx.timestamp).toEqual('2019-03-04T06:59:39Z');
		expect(paymentTx.type).toEqual('PaymentTransaction');
		expect(paymentTx.signatures).toHaveLength(1);
		expect(paymentTx.signatures[0].hint().toString('base64')).toEqual('uAMxrg==');
		expect(paymentTx.signatures[0].signature().toString('base64')).toEqual('Xz7znnYaWMpr0OGngpp9e0dYqT9F84JN/26j8FIzA7o/8GCSJIlBiVa7NaBEBo6n6GGYAxoAhBMcMax7q6mTCA==');
		const rawTx = transactions[1] as RawTransaction;
		expect(rawTx.source).toEqual('GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR');
		expect(rawTx.fee).toEqual(246);
		expect(rawTx.operations).toHaveLength(2);
		expect(rawTx.timestamp).toEqual('2019-03-03T18:23:59Z');
		expect(rawTx.type).toEqual('RawTransaction');
		let createAccountOp = rawTx.operations[0] as Operation.CreateAccount;
		expect(createAccountOp.startingBalance).toEqual("12.12345");
		expect(createAccountOp.destination).toEqual('GDXY3YWJXDIC2WOND6WVLQ7NP4VZAZ6MJCB4DNXUWN2GLGG3VK2ZX5TB');
		let manageDataOp = rawTx.operations[1] as Operation.ManageData;
		expect(manageDataOp.name).toEqual('test');
		expect(manageDataOp.value.toString('utf8')).toEqual('value');
		expect(rawTx.memo).toEqual(Memo.none());
		expect(rawTx.sequence).toEqual(5590101799206913);
		expect(rawTx.hash).toEqual('21e71521c34bc9a7981edaff3c87f32f989b8489195bd6797f2040ab7a604c70');
		expect(rawTx.signatures).toHaveLength(1);
		expect(rawTx.signatures[0].hint().toString('base64')).toEqual('uAMxrg==');
		expect(rawTx.signatures[0].signature().toString('base64')).toEqual('L7gOSDbnagBz0qwp4ZmRqDlpCEqmAiD0H6thfU8v91PpEQ+7pSNTRaJX1PkAbu61fiyCRfAY4NJfojNs6BU4Ag==');
		const createAccount = transactions[2] as CreateAccountTransaction;
		expect(createAccount.source).toEqual('GDHCB4VCNNFIMZI3BVHLA2FVASECBR2ZXHOAXEBBFVUH5G2YAD7V3JVH');
		expect(createAccount.fee).toEqual(100);
		expect(createAccount.destination).toEqual('GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR');
		expect(createAccount.startingBalance).toEqual(10000);
		expect(createAccount.memo).toBeUndefined();
		expect(createAccount.sequence).toEqual(1728);
		expect(createAccount.hash).toEqual('c8b8c11b4ef521dfce4b673754ec43860e321ff608985289b944ccff7a427316');
		expect(createAccount.timestamp).toEqual('2019-03-03T18:22:39Z');
		expect(createAccount.type).toEqual('CreateAccountTransaction');
		expect(createAccount.signatures).toHaveLength(1);
		expect(createAccount.signatures[0].hint().toString('base64')).toEqual('WAD/XQ==');
		expect(createAccount.signatures[0].signature().toString('base64')).toEqual('7stkmFoi3PKmeMEOSwvJexueg107rM497GnjjvZ3Vmw+MkYltp2FKgBCe7QPZ+2wl/9LGk4X0HnGWxfySKijDw==');

	});

	test("use all params, should request params from network", async () => {
		const address = "GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR";
		nock(fakeUrl)
			.get(uri => uri.includes(address) && uri.includes('asc')
				&& uri.includes('limit=3') && uri.includes('cursor=somecursor'))
			.reply(200, transactionListResponse);
		await transactionRetriever.fetchTransactionHistory({
			address: address,
			order: 'asc',
			limit: 3,
			cursor: 'somecursor'
		});
	});

	test("use just address in params, should have default params in request from network", async () => {
		const address = "GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR";
		nock(fakeUrl)
			.get(uri => uri.includes(address) && !uri.includes('asc')
				&& uri.includes('limit=10') && !uri.includes('cursor'))
			.reply(200, transactionListResponse);
		await transactionRetriever.fetchTransactionHistory({address: address});
	});

	test("no transaction, expect TransactionNotFoundError", async () => {
		const response: ErrorResponse = {
			"type": "https://stellar.org/horizon-errors/not_found",
			"title": "Resource Missing",
			"status": 404,
			"detail": "The resource at the url requested was not found.  This is usually occurs for one of two reasons:  The url requested is not valid, or no data in our database could be found with the parameters provided."
		};

		const address = "GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR";
		nock(fakeUrl)
			.get(url => url.includes(address))
			.reply(response.status, response);
		await expect(transactionRetriever.fetchTransactionHistory({address: address}))
			.rejects.toEqual(new ResourceNotFoundError(response));
	});

	test("server error code 500, expect ServerError", async () => {
		const response: ErrorResponse = {
			type: "https://stellar.org/horizon-errors/server_error",
			title: "Internal server Error",
			status: 500,
			detail: "Internal server Error."
		};

		const address = "GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR";
		nock(fakeUrl)
			.get(url => url.includes(address))
			.reply(response.status, response);
		await expect(transactionRetriever.fetchTransactionHistory({address: address}))
			.rejects.toEqual(new InternalError(response));
	});

	test("server error code 500, expect NetworkError", async () => {
		const address = "GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR";
		nock(fakeUrl)
			.get(url => url.includes(address))
			.replyWithError({code: 'ETIMEDOUT'});
		await expect(transactionRetriever.fetchTransactionHistory({address: address}))
			.rejects.toEqual(new NetworkError({code: 'ETIMEDOUT'}));
	});

});
