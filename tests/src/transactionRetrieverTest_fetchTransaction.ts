import {Server} from "@kinecosystem/kin-sdk";
import {TransactionRetriever} from "../../scripts/src/blockchain/transactionRetriever";
import * as nock from "nock";
import {CreateAccountTransaction, PaymentTransaction, RawTransaction} from "../../scripts/src/blockchain/horizonModels";
import {ErrorResponse, InternalError} from "../../scripts/src/errors";
import {Memo, Operation} from "@kinecosystem/kin-base";
import {ResourceNotFoundError} from "../../scripts/src/errors";

// as a workaround, TransactionRetriever was separated to two files due to some jest error when running both fetchTransactionHistory
// and fetchTransaction tests in the same file

const fakeUrl = "http://horizon.com";
let transactionRetriever: TransactionRetriever;

describe("TransactionRetriever.fetchTransaction", async () => {
	beforeAll(async () => {
		transactionRetriever = new TransactionRetriever(new Server(fakeUrl, {allowHttp: true}));
	});

	test("create account transaction, return CreateAccountTransaction", async () => {
		const transactionId = "cc9a643dde0167401459ca57199ac8eb45bff8f2ab8e21e1073cdbbbb121cfce";
		nock(fakeUrl)
			.get(uri => uri.includes(transactionId))
			.reply(200,
				{
					"memo": "1-anon-",
					"_links": {
						"self": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/cc9a643dde0167401459ca57199ac8eb45bff8f2ab8e21e1073cdbbbb121cfce"
						},
						"account": {
							"href": "https://horizon-testnet.kininfrastructure.com/accounts/GA444BDKREVBHVB3KOTD7DBV4EYOUD7KBOTZDCP76IK7QNRFBNQ4QEQU"
						},
						"ledger": {
							"href": "https://horizon-testnet.kininfrastructure.com/ledgers/1236925"
						},
						"operations": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/cc9a643dde0167401459ca57199ac8eb45bff8f2ab8e21e1073cdbbbb121cfce/operations{?cursor,limit,order}",
							"templated": true
						},
						"effects": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/cc9a643dde0167401459ca57199ac8eb45bff8f2ab8e21e1073cdbbbb121cfce/effects{?cursor,limit,order}",
							"templated": true
						},
						"precedes": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions?order=asc&cursor=5312552422608896"
						},
						"succeeds": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions?order=desc&cursor=5312552422608896"
						}
					},
					"id": "cc9a643dde0167401459ca57199ac8eb45bff8f2ab8e21e1073cdbbbb121cfce",
					"paging_token": "5312552422608896",
					"hash": "cc9a643dde0167401459ca57199ac8eb45bff8f2ab8e21e1073cdbbbb121cfce",
					"ledger": 1236925,
					"created_at": "2019-02-27T23:53:23Z",
					"source_account": "GA444BDKREVBHVB3KOTD7DBV4EYOUD7KBOTZDCP76IK7QNRFBNQ4QEQU",
					"source_account_sequence": "4175756183732464",
					"fee_paid": 100,
					"operation_count": 1,
					"envelope_xdr": "AAAAADnOBGqJKhPUO1OmP4w14TDqD+oLp5GJ//IV+DYlC2HIAAAAZAAO1dQAAADwAAAAAAAAAAEAAAAHMS1hbm9uLQAAAAABAAAAAQAAAAAjjW+ebKZEasbExbouA0mSnhHv2h88LZ+Fm2I8RDA0SAAAAAAAAAAAWeix/WXKMpmuvyCdpgcECSjeXtPc+Ccd3tdekqC0IIUAAAAAAAAAAAAAAAAAAAACJQthyAAAAEBQU9WPQLxauzZBy5usexFfk3x5scmyyMI+QhbZHbg3t1MTAtPyUU0Ky3fJHeGl//AseIPcfWsNPA8NXN5AwvMNRDA0SAAAAEC3VNq+TVe7I0NvVp98XvQNw5Ziz5/C4kSbrdCHXPP+avJra3uEu9UR92yh+j7AIYnl/dkXRwVBw4olzhXI+AgI",
					"result_xdr": "AAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAAS370AAAAAAAAAAFnosf1lyjKZrr8gnaYHBAko3l7T3PgnHd7XXpKgtCCFAAAAAAAAAAAAEt+9AAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAS0gwAAAAAAAAAACONb55spkRqxsTFui4DSZKeEe/aHzwtn4WbYjxEMDRIAAAAAC7oqsAADtBaAAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAS370AAAAAAAAAACONb55spkRqxsTFui4DSZKeEe/aHzwtn4WbYjxEMDRIAAAAAC7oqsAADtBaAAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA",
					"fee_meta_xdr": "AAAAAgAAAAMAEtIMAAAAAAAAAAA5zgRqiSoT1DtTpj+MNeEw6g/qC6eRif/yFfg2JQthyAAAAAAAAAAAAA7V1AAAAO8AAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAEAEt+9AAAAAAAAAAA5zgRqiSoT1DtTpj+MNeEw6g/qC6eRif/yFfg2JQthyAAAAAAAAAAAAA7V1AAAAPAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAA==",
					"memo_type": "text",
					"signatures": [
						"UFPVj0C8Wrs2QcubrHsRX5N8ebHJssjCPkIW2R24N7dTEwLT8lFNCst3yR3hpf/wLHiD3H1rDTwPDVzeQMLzDQ==",
						"t1Tavk1XuyNDb1affF70DcOWYs+fwuJEm63Qh1zz/mrya2t7hLvVEfdsofo+wCGJ5f3ZF0cFQcOKJc4VyPgICA=="
					]
				}
			);

		const transaction = await transactionRetriever.fetchTransaction(transactionId) as CreateAccountTransaction;
		expect(transaction.source).toEqual('GARY2346NSTEI2WGYTC3ULQDJGJJ4EPP3IPTYLM7QWNWEPCEGA2EQJK5'); //equals to operation source account, and not the tx source account
		expect(transaction.fee).toEqual(100);
		expect(transaction.destination).toEqual('GBM6RMP5MXFDFGNOX4QJ3JQHAQESRXS62POPQJY533LV5EVAWQQILWEE');
		expect(transaction.startingBalance).toEqual(0);
		expect(transaction.memo).toEqual('1-anon-');
		expect(transaction.sequence).toEqual(4175756183732464);
		expect(transaction.hash).toEqual(transactionId);
		expect(transaction.signatures[0].hint().toString('base64')).toEqual('JQthyA==');
		expect(transaction.signatures[0].signature().toString('base64')).toEqual('UFPVj0C8Wrs2QcubrHsRX5N8ebHJssjCPkIW2R24N7dTEwLT8lFNCst3yR3hpf/wLHiD3H1rDTwPDVzeQMLzDQ==');
		expect(transaction.signatures[1].hint().toString('base64')).toEqual('RDA0SA==');
		expect(transaction.signatures[1].signature().toString('base64')).toEqual('t1Tavk1XuyNDb1affF70DcOWYs+fwuJEm63Qh1zz/mrya2t7hLvVEfdsofo+wCGJ5f3ZF0cFQcOKJc4VyPgICA==');
	});

	test("payment transaction, return PaymentTransaction", async () => {
		const transactionId = "f316ef515013ef1fd4a93134458f70f6a5ade463e080d1fb279da60526a1516a";
		nock(fakeUrl)
			.get(uri => uri.includes(transactionId))
			.reply(200,
				{
					"memo": "1-ack1-",
					"_links": {
						"self": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/f316ef515013ef1fd4a93134458f70f6a5ade463e080d1fb279da60526a1516a"
						},
						"account": {
							"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBF5XEGQED4CGPLTCQGJNZIYEBV37CRFNFZDCOKU4ZNH2ZO5IK2V36VH"
						},
						"ledger": {
							"href": "https://horizon-testnet.kininfrastructure.com/ledgers/1206618"
						},
						"operations": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/f316ef515013ef1fd4a93134458f70f6a5ade463e080d1fb279da60526a1516a/operations{?cursor,limit,order}",
							"templated": true
						},
						"effects": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/f316ef515013ef1fd4a93134458f70f6a5ade463e080d1fb279da60526a1516a/effects{?cursor,limit,order}",
							"templated": true
						},
						"precedes": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions?order=asc&cursor=5182384848769024"
						},
						"succeeds": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions?order=desc&cursor=5182384848769024"
						}
					},
					"id": "f316ef515013ef1fd4a93134458f70f6a5ade463e080d1fb279da60526a1516a",
					"paging_token": "5182384848769024",
					"hash": "f316ef515013ef1fd4a93134458f70f6a5ade463e080d1fb279da60526a1516a",
					"ledger": 1206618,
					"created_at": "2019-02-26T05:47:48Z",
					"source_account": "GBF5XEGQED4CGPLTCQGJNZIYEBV37CRFNFZDCOKU4ZNH2ZO5IK2V36VH",
					"source_account_sequence": "5178712651726850",
					"fee_paid": 100,
					"operation_count": 1,
					"envelope_xdr": "AAAAAEvbkNAg+CM9cxQMluUYIGu/iiVpcjE5VOZafWXdQrVdAAAAZAASZgMAAAACAAAAAAAAAAEAAAAHMS1hY2sxLQAAAAABAAAAAAAAAAEAAAAAq/iTXCL0t2oPc1a+NNN6aK3r2QWfxuTih0Sif2i0mM8AAAAAAAAAAACYloAAAAAAAAAAAd1CtV0AAABAFq8/Kq9KV+KfRwcK5IW/wB/so76DEVNMz3li4Cwf59kdugMrxdmqoRDOT8X6jWqojUYxpfDM7J9Ucw4pscXoCg==",
					"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAEAAAAEAAAAAwASaVoAAAAAAAAAAEvbkNAg+CM9cxQMluUYIGu/iiVpcjE5VOZafWXdQrVdAAAAADsCMrgAEmYDAAAAAgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQASaVoAAAAAAAAAAEvbkNAg+CM9cxQMluUYIGu/iiVpcjE5VOZafWXdQrVdAAAAADppnDgAEmYDAAAAAgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwASaNMAAAAAAAAAAKv4k1wi9LdqD3NWvjTTemit69kFn8bk4odEon9otJjPAAAAAIUFBjgAAFN2AAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQASaVoAAAAAAAAAAKv4k1wi9LdqD3NWvjTTemit69kFn8bk4odEon9otJjPAAAAAIWdnLgAAFN2AAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA",
					"fee_meta_xdr": "AAAAAgAAAAMAEmjTAAAAAAAAAABL25DQIPgjPXMUDJblGCBrv4olaXIxOVTmWn1l3UK1XQAAAAA7AjMcABJmAwAAAAEAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAEAEmlaAAAAAAAAAABL25DQIPgjPXMUDJblGCBrv4olaXIxOVTmWn1l3UK1XQAAAAA7AjK4ABJmAwAAAAIAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAA==",
					"memo_type": "text",
					"signatures": [
						"Fq8/Kq9KV+KfRwcK5IW/wB/so76DEVNMz3li4Cwf59kdugMrxdmqoRDOT8X6jWqojUYxpfDM7J9Ucw4pscXoCg=="
					]
				}
			);

		const transaction = await transactionRetriever.fetchTransaction(transactionId) as PaymentTransaction;
		expect(transaction.source).toEqual('GBF5XEGQED4CGPLTCQGJNZIYEBV37CRFNFZDCOKU4ZNH2ZO5IK2V36VH');
		expect(transaction.fee).toEqual(100);
		expect(transaction.destination).toEqual('GCV7RE24EL2LO2QPONLL4NGTPJUK326ZAWP4NZHCQ5CKE73IWSMM7QXG');
		expect(transaction.amount).toEqual(100);
		expect(transaction.memo).toEqual('1-ack1-');
		expect(transaction.sequence).toEqual(5178712651726850);
		expect(transaction.hash).toEqual(transactionId);
		expect(transaction.signatures).toHaveLength(1);
		expect(transaction.signatures[0].hint().toString('base64')).toEqual('3UK1XQ==');
		expect(transaction.signatures[0].signature().toString('base64')).toEqual('Fq8/Kq9KV+KfRwcK5IW/wB/so76DEVNMz3li4Cwf59kdugMrxdmqoRDOT8X6jWqojUYxpfDM7J9Ucw4pscXoCg==');
	});

	test("raw transaction, return RawTransaction", async () => {
		const transactionId = "21e71521c34bc9a7981edaff3c87f32f989b8489195bd6797f2040ab7a604c70";
		nock(fakeUrl)
			.get(uri => uri.includes(transactionId))
			.reply(200,
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
				}
			);

		const transaction = await transactionRetriever.fetchTransaction(transactionId) as RawTransaction;
		expect(transaction.source).toEqual('GA66MWLBBBWVDQZFPDMZPJUODUUOZLGUPCXMPR7HNTGHX7VYAMY243RR');
		expect(transaction.fee).toEqual(246);
		expect(transaction.operations).toHaveLength(2);
		let createAccountOp = transaction.operations[0] as Operation.CreateAccount;
		expect(createAccountOp.startingBalance).toEqual("12.12345");
		expect(createAccountOp.destination).toEqual('GDXY3YWJXDIC2WOND6WVLQ7NP4VZAZ6MJCB4DNXUWN2GLGG3VK2ZX5TB');
		let manageDataOp = transaction.operations[1] as Operation.ManageData;
		expect(manageDataOp.name).toEqual('test');
		expect(manageDataOp.value.toString('utf8')).toEqual('value');
		expect(transaction.memo).toEqual(Memo.none());
		expect(transaction.sequence).toEqual(5590101799206913);
		expect(transaction.hash).toEqual(transactionId);
		expect(transaction.signatures).toHaveLength(1);
		expect(transaction.signatures[0].hint().toString('base64')).toEqual('uAMxrg==');
		expect(transaction.signatures[0].signature().toString('base64')).toEqual('L7gOSDbnagBz0qwp4ZmRqDlpCEqmAiD0H6thfU8v91PpEQ+7pSNTRaJX1PkAbu61fiyCRfAY4NJfojNs6BU4Ag==');
	});

	test("no transaction, expect TransactionNotFoundError", async () => {
		const response: ErrorResponse = {
					"type": "https://stellar.org/horizon-errors/not_found",
					"title": "Resource Missing",
					"status": 404,
					"detail": "The resource at the url requested was not found.  This is usually occurs for one of two reasons:  The url requested is not valid, or no data in our database could be found with the parameters provided."
				};

		const transactionId = "cc9a643dde0167401459ca57199ac8eb45bff8f2ab8e21e1073cdbbbb121cfce";
		nock(fakeUrl)
			.get(url => url.includes(transactionId))
			.reply(response.status, response);
		await expect(transactionRetriever.fetchTransaction(transactionId))
			.rejects.toEqual(new ResourceNotFoundError(response));
	});

	test("server error code 500, expect ServerError", async () => {
		const response: ErrorResponse = {
			type: "https://stellar.org/horizon-errors/server_error",
			title: "Internal server Error",
			status: 500,
			detail: "Internal server Error."
		};

		const transactionId = "cc9a643dde0167401459ca57199ac8eb45bff8f2ab8e21e1073cdbbbb121cfce";
		mockNetworkResponse(response, transactionId);
		await expect(transactionRetriever.fetchTransaction(transactionId))
			.rejects.toEqual(new InternalError(response));
	});

	test("server error code 500, expect NetworkError", async () => {
		const transactionId = "cc9a643dde0167401459ca57199ac8eb45bff8f2ab8e21e1073cdbbbb121cfce";
		nock(fakeUrl)
			.get(url => url.includes(transactionId))
			.replyWithError({code: 'scripts/src'});
		await expect(transactionRetriever.fetchTransaction(transactionId))
			.rejects.toHaveProperty('type', 'NetworkError');
	});

});

function mockNetworkResponse(response: ErrorResponse, includes: string) {
	nock(fakeUrl)
		.get(url => url.includes(includes))
		.reply(response.status, response);
}
