import {AccountDataRetriever} from "../../scripts/bin/blockchain/accountDataRetriever";
import {Server} from "@kinecosystem/kin-sdk";
import {AccountData} from "../../scripts/bin/blockchain/horizonModels";
import * as nock from "nock";
import {AccountNotFoundError, ServerError} from "../../scripts/bin/errors";
import {InvalidAddress} from "../../scripts/src/errors";

const fakeUrl = "http://horizon.com";
const publicAddress = "GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ";
let accountDataRetriever: AccountDataRetriever;

describe("AccountDataRetreiver.fetchAccountData", async () => {
	beforeAll(async () => {
		accountDataRetriever = new AccountDataRetriever(new Server(fakeUrl, {allowHttp: true}));
	});

	test("too long address, expect InvalidAddressError", async () => {
		await expect(accountDataRetriever.fetchAccountData(publicAddress + "A"))
			.rejects.toEqual(new InvalidAddress());
	});

	test("invalid address, expect InvalidAddressError", async () => {
		await expect(accountDataRetriever.fetchAccountData("GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOB"))
			.rejects.toEqual(new InvalidAddress());
	});

	test("returned AccountData object matches network data", async () => {
		mockAccountNetworkResponse();

		const accountData = await accountDataRetriever.fetchAccountData(publicAddress);
		expect(accountData.accountId).toBe("GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ");
		expect(accountData.id).toBe("GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ");
		expect(accountData.balances).toHaveLength(2);
		const balance0: AccountData.Balance = {
			assetType: "credit_alphanum4",
			balance: 2.12345,
			assetIssuer: "GBC3SG6NGTSZ2OMH3FFGB7UVRQWILW367U4GSOOF4TFSZONV42UJXUH7",
			assetCode: "TEST",
			limit: 922337200000.00000
		};
		expect(accountData.balances[0]).toEqual(balance0);
		const balance1: AccountData.Balance = {
			assetType: "native",
			balance: 2.96005
		};
		expect(accountData.balances[1]).toEqual(balance1);
		expect(accountData.sequenceNumber).toEqual(9357771665313568);
		expect(accountData.data).toEqual({});
		expect(accountData.flags).toEqual({
			authRequired: false,
			authRevocable: false
		});
		expect(accountData.signers).toHaveLength(1);
		expect(accountData.signers[0]).toEqual({
			publicKey: "GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ",
			weight: 1
		});
		expect(accountData.thresholds).toEqual({
			lowThreshold: 0,
			medThreshold: 0,
			highThreshold: 0
		});
		expect(accountData.pagingToken).toEqual("");

	});

	test("no account, expect AccountNotFoundError", async () => {
		mock404NetworkResponse();
		await expect(accountDataRetriever.fetchAccountData(publicAddress))
			.rejects.toEqual(new AccountNotFoundError(publicAddress));
	});

	test("error 500, expect ServerError", async () => {
		mock500NetworkResponse();
		await expect(accountDataRetriever.fetchAccountData(publicAddress))
			.rejects.toEqual(new ServerError(500));
	});

	test("timeout error, expect NetworkError", async () => {
		mockTimeoutNetworkReponse();
		//TODO check stellar sdk for exposing network errors up
		await expect(accountDataRetriever.fetchAccountData(publicAddress))
			.rejects.toBeDefined();
	});

});

describe("AccountDataRetreiver.fetchKinBalance", async () => {
	beforeAll(async () => {
		accountDataRetriever = new AccountDataRetriever(new Server(fakeUrl, {allowHttp: true}));
	});

	test("too long address, expect InvalidAddressError", async () => {
		await expect(accountDataRetriever.fetchKinBalance(publicAddress + "A"))
			.rejects.toEqual(new InvalidAddress());
	});

	test("invalid address, expect InvalidAddressError", async () => {
		await expect(accountDataRetriever.fetchKinBalance("GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOB"))
			.rejects.toEqual(new InvalidAddress());
	});

	test("balance should match network balance", async () => {
		mockAccountNetworkResponse();

		expect(await accountDataRetriever.fetchKinBalance(publicAddress)).toBe(2.96005);
	});

	test("no account, expect AccountNotFoundError", async () => {
		mock404NetworkResponse();
		await expect(accountDataRetriever.fetchKinBalance(publicAddress))
			.rejects.toEqual(new AccountNotFoundError(publicAddress));
	});

	test("error 500, expect ServerError", async () => {
		mock500NetworkResponse();
		await expect(accountDataRetriever.fetchKinBalance(publicAddress))
			.rejects.toEqual(new ServerError(500));
	});

	test("timeout error, expect NetworkError", async () => {
		mockTimeoutNetworkReponse();
		//TODO check stellar sdk for exposing network errors up
		await expect(accountDataRetriever.fetchKinBalance(publicAddress))
			.rejects.toBeDefined();
	});

});

describe("AccountDataRetreiver.isAccountExisting", async () => {
	beforeAll(async () => {
		accountDataRetriever = new AccountDataRetriever(new Server(fakeUrl, {allowHttp: true}));
	});

	test("too long address, expect InvalidAddressError", async () => {
		await expect(accountDataRetriever.isAccountExisting(publicAddress + "A"))
			.rejects.toEqual(new InvalidAddress());
	});

	test("invalid address, expect InvalidAddressError", async () => {
		await expect(accountDataRetriever.isAccountExisting("GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOB"))
			.rejects.toEqual(new InvalidAddress());
	});

	test("account exists, should return true", async () => {
		mockAccountNetworkResponse();

		expect(await accountDataRetriever.isAccountExisting(publicAddress)).toBe(true);
	});

	test("no account, should return false", async () => {
		mock404NetworkResponse();
		expect(await accountDataRetriever.isAccountExisting(publicAddress)).toBe(false);
	});

	test("error 500, expect ServerError", async () => {
		mock500NetworkResponse();
		await expect(accountDataRetriever.isAccountExisting(publicAddress))
			.rejects.toEqual(new ServerError(500));
	});

	test("timeout error, expect NetworkError", async () => {
		mockTimeoutNetworkReponse();
		//TODO check stellar sdk for exposing network errors up
		await expect(accountDataRetriever.isAccountExisting(publicAddress))
			.rejects.toBeDefined();
	});

});

function mockAccountNetworkResponse() {
	nock(fakeUrl)
		.get(url => url.includes(publicAddress))
		.reply(200,
			{
				"_links": {
					"self": {
						"href": "https://horizon-playground.kininfrastructure.com/accounts/GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ"
					},
					"transactions": {
						"href": "https://horizon-playground.kininfrastructure.com/accounts/GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ/transactions{?cursor,limit,order}",
						"templated": true
					},
					"operations": {
						"href": "https://horizon-playground.kininfrastructure.com/accounts/GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ/operations{?cursor,limit,order}",
						"templated": true
					},
					"payments": {
						"href": "https://horizon-playground.kininfrastructure.com/accounts/GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ/payments{?cursor,limit,order}",
						"templated": true
					},
					"effects": {
						"href": "https://horizon-playground.kininfrastructure.com/accounts/GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ/effects{?cursor,limit,order}",
						"templated": true
					},
					"offers": {
						"href": "https://horizon-playground.kininfrastructure.com/accounts/GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ/offers{?cursor,limit,order}",
						"templated": true
					},
					"trades": {
						"href": "https://horizon-playground.kininfrastructure.com/accounts/GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ/trades{?cursor,limit,order}",
						"templated": true
					},
					"data": {
						"href": "https://horizon-playground.kininfrastructure.com/accounts/GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ/data/{key}",
						"templated": true
					}
				},
				"id": "GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ",
				"paging_token": "",
				"account_id": "GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ",
				"sequence": "9357771665313568",
				"subentry_count": 1,
				"thresholds": {
					"low_threshold": 0,
					"med_threshold": 0,
					"high_threshold": 0
				},
				"flags": {
					"auth_required": false,
					"auth_revocable": false
				},
				"balances": [
					{
						"balance": "2.12345",
						"limit": "922337200000.00000",
						"asset_type": "credit_alphanum4",
						"asset_code": "TEST",
						"asset_issuer": "GBC3SG6NGTSZ2OMH3FFGB7UVRQWILW367U4GSOOF4TFSZONV42UJXUH7"
					},
					{
						"balance": "2.96005",
						"asset_type": "native"
					}
				],
				"signers": [
					{
						"public_key": "GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ",
						"weight": 1,
						"key": "GDAVCZIOYRGV74ROE344CMRLPZYSZVRHNTRFGOUSAQBILJ7M5ES25KOZ",
						"type": "ed25519_public_key"
					}
				],
				"data": {}
			}
		);

}

function mock404NetworkResponse() {
	nock(fakeUrl)
		.get(url => url.includes(publicAddress))
		.reply(404,
			{
				"type": "https://stellar.org/horizon-errors/not_found",
				"title": "Resource Missing",
				"status": 404,
				"detail": "The resource at the url requested was not found.  This is usually occurs for one of two reasons:  The url requested is not valid, or no data in our database could be found with the parameters provided."
			});

}

function mockTimeoutNetworkReponse() {
	nock(fakeUrl)
		.get(url => url.includes(publicAddress))
		.replyWithError({code: 'ETIMEDOUT'});
}

function mock500NetworkResponse() {
	nock(fakeUrl)
		.get(url => url.includes(publicAddress))
		.reply(500,
			{
				"type": "https://stellar.org/horizon-errors/not_found",
				"title": "Internal server Error",
				"status": 500,
				"detail": "Internal server Error."
			});
}