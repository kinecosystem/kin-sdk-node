import {Server} from "@kinecosystem/kin-sdk";
import * as nock from "nock";

import {KinAccount} from "../../scripts/src/kinAccount";
import {AccountDataRetriever} from "../../scripts/src/blockchain/accountDataRetriever";
import {BadRequestError, ErrorResponse, LowBalanceError} from "../../scripts/src/errors";
import {Environment} from "../../scripts/src/environment";
import {Memo, Network, Operation} from "@kinecosystem/kin-base";
import {WhitelistPayload} from "../../scripts/src/types";
import {BlockchainInfoRetriever} from "../../scripts/src/blockchain/blockchainInfoRetriever";

const fakeUrl = "http://horizon.com";
const server = new Server(fakeUrl, {allowHttp: true});
const accountDataRetriever = new AccountDataRetriever(server);
const senderSeed = "SBVYIBM6UTDHMN7RN6VVEFKABRQBW3YB7W7RYFZFTBD6YX3IDFLS7NGW";
const senderPublic = "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65";
const receiverPublic = "GBFVXO4TI53WQVBCFZG7C4ZKPFP5Y6S6M3OZMTDVATUHQS7LXRWLWF5S";
const appId = "aaaa";
const fee = 100;
const memo = "test memo";
let kinAccount: KinAccount;


describe("KinAccount.createAccount", async () => {
	beforeAll(async () => {
		Network.use(new Network(Environment.Testnet.passphrase));
		kinAccount = new KinAccount(senderSeed, accountDataRetriever, server, new BlockchainInfoRetriever(server), appId);
	});

	test("builder transaction, create account succeed", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockBuilderCreateAccountResponse();

		const txBuilder = await kinAccount.getTransactionBuilder({
			fee: fee
		});
		txBuilder.addFee(10);
		txBuilder.addMemo(Memo.text(memo));
		txBuilder.addOperation(Operation.createAccount({
			source: senderPublic,
			destination: receiverPublic,
			startingBalance: '10000'
		}));
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual("6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95");
	});

	test("account created build transaction", async () => {
		mockLoadAccountResponse("6319125253062661");

		const txBuilder = await kinAccount.buildCreateAccount(
			{
				address: receiverPublic,
				startingBalance: 10000,
				fee: fee,
				memoText: memo
			});
		expect((txBuilder as any)._transactionBuilder.baseFee).toEqual(fee);
		expect((txBuilder as any)._transactionBuilder.memo._value).toEqual('1-' + appId + '-' + memo);
		expect((txBuilder as any)._transactionBuilder.source.id).toEqual(senderPublic);
		expect((txBuilder as any)._transactionBuilder.source.sequence).toEqual("6319125253062661");
		expect(txBuilder.build().toEnvelope().toXDR('base64')).toEqual("AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAQMS1hY" +
			"WFhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAAAABLW7uTR3doVCIuTfFzKnlf3HpeZt2WTHUE6HhL67xsuwAAAAA7msoAAAAAAAAAAAA=");
	});

	test("create account, send transaction succeed", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockCreateAccountResponse();

		const txBuilder = await kinAccount.buildCreateAccount({
			address: 'GBW3U6FTJQ3JAZXSS46NHX7WF4SG2J5D6HKDBVDFHNVAKZRM672F2GDP',
			startingBalance: 10,
			fee: fee,
			memoText: memo
		});
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual("6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95");
	});

	test("create account tx_insufficient_balance, error expect 400 ServerError", async () => {
		const response: ErrorResponse = {
			type: "https://stellar.org/horizon-errors/transaction_failed",
			title: "Transaction Failed",
			status: 400,
			detail: "The transaction failed when submitted to the stellar network. The `extras.result_codes` field on this response contains further details.  " +
				"Descriptions of each code can be found at: https://www.stellar.org/developers/learn/concepts/list-of-operations.html",
			extras: {
				envelope_xdr: "AAAAAOzY9WfVBnssuWevXxORz2d6Qfig4qWIRzwD1ObqTmkjAAAAZAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAAA" +
					"AAAAAKSsO2j1EiYi4rydi+K+YdTC2HcWfMoKjHOd0/wIiaozAAAAAAX14QAAAAAAAAAAAepOaSMAAABAjwXKIwLrKSCjdfniUpIMlUIJCKOgGOIgbbHglPfXXqTVQslY8jm+/gg0pa" +
					"O2MMox/2QXuucftQktxZ3ni69LDA==",
				result_codes: {
					transaction: "tx_insufficient_balance"
				},
				result_xdr: "AAAAAAAAAAD////7AAAAAA=="
			}
		}
		mockLoadAccountResponse("6319125253062657");
		mock400AccountResponse(response);

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 10,
			fee: fee,
			memoText: memo
		});
		await expect(kinAccount.submitTransaction(txBuilder)).rejects.toEqual(new LowBalanceError(response));
	});

	test("create account tx_bad_seq, error expect 400 ServerError", async () => {
		const response: ErrorResponse = {
			type: "https://stellar.org/horizon-errors/transaction_failed",
			title: "Transaction Failed",
			status: 400,
			detail: "The transaction failed when:q submitted to the stellar network. The `extras.result_codes` field on this response contains further details.  " +
				"Descriptions of each code can be found at: https://www.stellar.org/developers/learn/concepts/list-of-operations.html",
			extras: {
				envelope_xdr: "AAAAAOzY9WfVBnssuWevXxORz2d6Qfig4qWIRzwD1ObqTmkjAAAAZAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAAAAA" +
					"AAAKSsO2j1EiYi4rydi+K+YdTC2HcWfMoKjHOd0/wIiaozAAAAAAX14QAAAAAAAAAAAepOaSMAAABAjwXKIwLrKSCjdfniUpIMlUIJCKOgGOIgbbHglPfXXqTVQslY8jm+/gg0paO2MM" +
					"ox/2QXuucftQktxZ3ni69LDA==",
				result_codes: {
					transaction: "tx_bad_seq"
				},
				result_xdr: "AAAAAAAAAAD////7AAAAAA=="
			}
		}
		mockLoadAccountResponse("6319125253062657");
		mock400AccountResponse(response);

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 10,
			fee: fee,
			memoText: memo
		});
		await expect(kinAccount.submitTransaction(txBuilder)).rejects.toEqual(new BadRequestError(response));
	});

	test("send kin", async () => {
		mockLoadAccountResponse("6319125253062662");
		mockSendKinResponse();

		const txBuilder = await kinAccount.buildSendKin({
			address: receiverPublic,
			amount: 23.3,
			fee: fee,
			memoText: memo
		});
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual("708ebb9e3c8890333daca3faa6707b89dc0155f2578314e302f39e7387d2d07c");
	});

	test("send kin, error expect 400 ServerError. when error tx_bad_seq expect BadRequestError", async () => {
		const response: ErrorResponse = {
			type: "https://stellar.org/horizon-errors/transaction_failed",
			title: "Transaction Failed",
			status: 400,
			detail: "The transaction failed when submitted to the stellar network. The `extras.result_codes` field on this response contains further details.  " +
				"Descriptions of each code can be found at: https://www.stellar.org/developers/learn/concepts/list-of-operations.html",
			extras: {
				envelope_xdr: "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAXi3wAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAALGk81+NzKns" +
					"t96N+pghxVE61OL/ZTzDk7HfJKdHPJJ0AAAAAAAAAAAAmJaAAAAAAAAAAAHsrih8AAAAQMVoAvHh39F3G4kWnaa/JWBPaoDgFLyND5s0mw3waQTiU7cp1eZ64N+ZrY2lRn9B4YinNM" +
					"qfWauQjviJdPHOdwc=",
				result_codes: {
					transaction: "tx_bad_seq"
				},
				result_xdr: "AAAAAAAAAAD////7AAAAAA=="
			}
		}

		mockLoadAccountResponse("6319125253062657");
		mock400SendKinResponse(response);

		const txBuilder = await kinAccount.buildSendKin({
			address: receiverPublic,
			amount: 10,
			fee: fee,
			memoText: memo
		});
		await expect(kinAccount.submitTransaction(txBuilder)).rejects.toEqual(new BadRequestError(response));
	});

	test("whitelist transaction - send kin", async () => {
		let envelope = "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAXi3wAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAABAAAAAMn/" +
			"CFYMgqIVL2JthzKcO+0IQKdG8GGNFDf6BjKHT1KPAAAAAAAAAAAF9eEAAAAAAAAAAAA=";
		const txPair: WhitelistPayload = {envelope: envelope, networkId: Network.current().networkPassphrase()};
		await expect(kinAccount.whitelistTransaction(txPair)).toEqual("AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAXi3wAAAABAAAAAQAAAAAAAAAAAAAAAAAAA" +
			"AAAAAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAABAAAAAMn/CFYMgqIVL2JthzKcO+0IQKdG8GGNFDf6BjKHT1KPAAAAAAAAAAAF9eEAAAAAAAAAAAHsrih8AAAAQEp6EC/3dO8zMeY33USui59M" +
			"PIxxLaXsiYWxSVaIX7MwNaocb+NyoR5++eT/GPynxbPKQptftf/JPv2FNev2VwU=");
	});


	test("create account, no memo, expect error", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockMissingMemoResponse();

		const txBuilder = await kinAccount.buildCreateAccount({
			address: 'GBW3U6FTJQ3JAZXSS46NHX7WF4SG2J5D6HKDBVDFHNVAKZRM672F2GDP',
			startingBalance: 10,
			fee: fee
		});
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual("6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95");
	});


	test("create account, add memo", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockAddMemoResponse();

		const txBuilder = await kinAccount.buildCreateAccount({
			address: 'GBW3U6FTJQ3JAZXSS46NHX7WF4SG2J5D6HKDBVDFHNVAKZRM672F2GDP',
			startingBalance: 10,
			fee: fee
		});
		txBuilder.addMemo(Memo.text(memo));
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual("6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95");
	});

	test("send kin, change fee before submitting transaction", async () => {
		mockLoadAccountResponse("6319125253062662");
		mockAddFeeResponse();

		const txBuilder = await kinAccount.buildSendKin({
			address: receiverPublic,
			amount: 23.3,
			fee: fee,
			memoText: memo
		});
		txBuilder.addFee(20);
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual("708ebb9e3c8890333daca3faa6707b89dc0155f2578314e302f39e7387d2d07c");
	});

});

function mock400SendKinResponse(response: ErrorResponse) {
	nock(fakeUrl)
		.post(url => url.includes("/transactions"), /tx=\w+/gi)
		.reply(response.status, response);
}

function mock400AccountResponse(response: ErrorResponse) {
	nock(fakeUrl)
		.post(url => url.includes("/transactions"), /tx=\w+/gi)
		.reply(400, response);
}

function mockLoadAccountResponse(sequence: string) {
	nock(fakeUrl)
		.get(url => url.includes(senderPublic))
		.reply(200,
			{
				"_links": {
					"self": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65"
					},
					"transactions": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65/transactions{?cursor,limit,order}",
						"templated": true
					},
					"operations": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65/operations{?cursor,limit,order}",
						"templated": true
					},
					"payments": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65/payments{?cursor,limit,order}",
						"templated": true
					},
					"effects": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65/effects{?cursor,limit,order}",
						"templated": true
					},
					"offers": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65/offers{?cursor,limit,order}",
						"templated": true
					},
					"trades": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65/trades{?cursor,limit,order}",
						"templated": true
					},
					"data": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65/data/{key}",
						"templated": true
					}
				},
				"id": "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65",
				"paging_token": "",
				"account_id": "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65",
				"sequence": sequence,
				"subentry_count": 0,
				"thresholds": {
					"low_threshold": 0,
					"med_threshold": 0,
					"high_threshold": 0
				},
				"flags": {
					"auth_required": false,
					"auth_revocable": false,
					"auth_immutable": false
				},
				"balances": [
					{
						"balance": "9899.99900",
						"buying_liabilities": "0.00000",
						"selling_liabilities": "0.00000",
						"asset_type": "native"
					}
				],
				"signers": [
					{
						"public_key": "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65",
						"weight": 1,
						"key": "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65",
						"type": "ed25519_public_key"
					}
				],
				"data": {}
			}
		);
}

function mockBuilderCreateAccountResponse() {
	nock(fakeUrl)
		.post(url => url.includes("/transactions"), "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAACgAWczYAAAAGAAAAAAAAA" +
			"AEAAAAQMS1hYWFhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAAAABLW7uTR3doVCIuTfFzKnlf3HpeZt2WTHUE6HhL67xsuwAAA" +
			"AA7msoAAAAAAAAAAAHsrih8AAAAQIbUcMf2hOWK42YlO8cWIGnZIYuTPj739NhH8WeB5mIEgaNfwyrWvdNUkAInnNoTGu6DdbMky5izo9QEgLeZ0gg%3D")
		.reply(200,
			{
				"_links": {
					"transaction": {
						"href": "https://horizon-testnet.kininfrastructure.com/transactions/6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95"
					}
				},
				"hash": "6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95",
				"ledger": 1761292,
				"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGay" +
					"hQMZWWRAZyMZdsXZ9frZpM+yuKHwAAAAAAAAAAG26eLNMNpBm8pc809/2LyRtJ6Px1DDUZTtqBWYs9/RdAAAAAAAPQkAAAAAAAAAAAeyuKHwAAABAR1kR5lr0GnNYwajx4JJ7W1dnO3" +
					"Pjl8soKjgKH6AK6c8MgKLEeyh24TJkOKPrxFmnYnr3uhXTPy+hJTQv7R6ZCg==",
				"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
				"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAAa4AwAAAAAAAAAAG26eLNMNpBm8pc809/2LyRtJ6Px1DDUZTtqBWYs9/RdAAAAAAAPQkAAGuAMAAAAAAAAAAAAAAAAAAAAAAAAAAAB" +
					"AAAAAAAAAAAAAAAAAAAAAAAAAwAa4AwAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHhZ8gAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAA" +
					"AAAAAAAAAAAAAAQAa4AwAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHSJYgAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
			});
}

function mockCreateAccountResponse() {
	nock(fakeUrl)
		.post(url => url.includes("/transactions"), "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAE" +
			"AAAAQMS1hYWFhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAAAABtunizTDaQZvKXPNPf9i8kbSej8dQw1GU7agVmLPf0XQAAAAAAD" +
			"0JAAAAAAAAAAAHsrih8AAAAQAcqtM7IY%2FdojHCYDZHlGyU9khht6BmyFnYyffwcXgQXuYRyRbIEZFKawz4jQznYVSgQQnHSoYqHtaO0J%2BVLmwA%3D")
		.reply(200,
			{
				"_links": {
					"transaction": {
						"href": "https://horizon-testnet.kininfrastructure.com/transactions/6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95"
					}
				},
				"hash": "6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95",
				"ledger": 1761292,
				"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGayhQ" +
					"MZWWRAZyMZdsXZ9frZpM+yuKHwAAAAAAAAAAG26eLNMNpBm8pc809/2LyRtJ6Px1DDUZTtqBWYs9/RdAAAAAAAPQkAAAAAAAAAAAeyuKHwAAABAR1kR5lr0GnNYwajx4JJ7W1dnO3Pjl8" +
					"soKjgKH6AK6c8MgKLEeyh24TJkOKPrxFmnYnr3uhXTPy+hJTQv7R6ZCg==",
				"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
				"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAAa4AwAAAAAAAAAAG26eLNMNpBm8pc809/2LyRtJ6Px1DDUZTtqBWYs9/RdAAAAAAAPQkAAGuAMAAAAAAAAAAAAAAAAAAAAAAAAAAABAAA" +
					"AAAAAAAAAAAAAAAAAAAAAAwAa4AwAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHhZ8gAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAA" +
					"AAAAAAAAQAa4AwAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHSJYgAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
			});
}

function mockSendKinResponse() {
	nock(fakeUrl)
		.post(url => url.includes("/transactions"), "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAHAAAAAAAAAAEAAA" +
			"AQMS1hYWFhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAQAAAABLW7uTR3doVCIuTfFzKnlf3HpeZt2WTHUE6HhL67xsuwAAAAAAAAAAACO" +
			"NkAAAAAAAAAAB7K4ofAAAAECVwez0u84Tk%2BNbQbh5srOCmYv4vE81P23nW6uy1oQAhpTuwJ%2Bm0LbprWH9GGUl3zZV%2FZYcM9ghOJBRyZ55glcO")
		.reply(200,
			{
				"_links": {
					"transaction": {
						"href": "https://horizon-testnet.kininfrastructure.com/transactions/708ebb9e3c8890333daca3faa6707b89dc0155f2578314e302f39e7387d2d07c"
					}
				},
				"hash": "708ebb9e3c8890333daca3faa6707b89dc0155f2578314e302f39e7387d2d07c",
				"ledger": 1761321,
				"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAHAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGayhQMZWW" +
					"RAZyMZdsXZ9frZpM+yuKHwAAAABAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAAAAAAAAI42QAAAAAAAAAAHsrih8AAAAQMKY/BIzE+nLdSm27j41TtHb55NgG36Z2w" +
					"X3cDjAJco9PCxrn7rwoFoq/ALjdp/jLitNfefgA6h0+CrGWWEioQE=",
				"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=",
				"result_meta_xdr": "AAAAAAAAAAEAAAAEAAAAAwAaK2EAAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAABWXWAAGiCfAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAA" +
					"AAAAAAAAAAAAAAAAAAAQAa4CkAAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAAB56vAAGiCfAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAA" +
					"AAwAa4CkAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHSJSQAFnM2AAAABwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAa4CkAAAAAAAAA" +
					"AG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALGul5QAFnM2AAAABwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
			});
}


function mockMissingMemoResponse() {
	nock(fakeUrl)
		.post(url => url.includes("/transactions"), "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAHM" +
			"S1hYWFhLQAAAAABAAAAAQAAAABvNPfjIRmfNq0ZrKFAxlZZEBnIxl2xdn1%2Btmkz7K4ofAAAAAAAAAAAbbp4s0w2kGbylzzT3%2FYvJG0no%2FHUMNRlO2oFZiz39F0AAAAAAA9CQAAAAAAAAAAB7K4of" +
			"AAAAEAme%2F5beR7kQm9B%2B1b9CLd9swfG3dHLml0QRG72pOuOkqDAgIB%2BmryTtl4m7BYM5SXNqjq80XPxgrTvfzPY%2F6oP")
		.reply(200,
			{
				"_links": {
					"transaction": {
						"href": "https://horizon-testnet.kininfrastructure.com/transactions/6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95"
					}
				},
				"hash": "6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95",
				"ledger": 1761292,
				"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGayhQMZWWRA" +
					"ZyMZdsXZ9frZpM+yuKHwAAAAAAAAAAG26eLNMNpBm8pc809/2LyRtJ6Px1DDUZTtqBWYs9/RdAAAAAAAPQkAAAAAAAAAAAeyuKHwAAABAR1kR5lr0GnNYwajx4JJ7W1dnO3Pjl8soKjgKH6AK6c" +
					"8MgKLEeyh24TJkOKPrxFmnYnr3uhXTPy+hJTQv7R6ZCg==",
				"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
				"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAAa4AwAAAAAAAAAAG26eLNMNpBm8pc809/2LyRtJ6Px1DDUZTtqBWYs9/RdAAAAAAAPQkAAGuAMAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAA" +
					"AAAAAAAAAAAAAAAAwAa4AwAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHhZ8gAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAa4" +
					"AwAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHSJYgAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
			});
}


function mockAddMemoResponse() {
	nock(fakeUrl)
		.post(url => url.includes("/transactions"), "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAQMS1h" +
			"YWFhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAAAABtunizTDaQZvKXPNPf9i8kbSej8dQw1GU7agVmLPf0XQAAAAAAD0JAAAAAAAAAAAHsrih" +
			"8AAAAQAcqtM7IY%2FdojHCYDZHlGyU9khht6BmyFnYyffwcXgQXuYRyRbIEZFKawz4jQznYVSgQQnHSoYqHtaO0J%2BVLmwA%3D")
		.reply(200,
			{
				"_links": {
					"transaction": {
						"href": "https://horizon-testnet.kininfrastructure.com/transactions/6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95"
					}
				},
				"hash": "6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95",
				"ledger": 1761292,
				"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGayhQMZWWRAZyM" +
					"ZdsXZ9frZpM+yuKHwAAAAAAAAAAG26eLNMNpBm8pc809/2LyRtJ6Px1DDUZTtqBWYs9/RdAAAAAAAPQkAAAAAAAAAAAeyuKHwAAABAR1kR5lr0GnNYwajx4JJ7W1dnO3Pjl8soKjgKH6AK6c8MgKLE" +
					"eyh24TJkOKPrxFmnYnr3uhXTPy+hJTQv7R6ZCg==",
				"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
				"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAAa4AwAAAAAAAAAAG26eLNMNpBm8pc809/2LyRtJ6Px1DDUZTtqBWYs9/RdAAAAAAAPQkAAGuAMAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAA" +
					"AAAAAAAAAAAAAwAa4AwAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHhZ8gAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAa4AwAAAA" +
					"AAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHSJYgAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
			});
}

function mockAddFeeResponse() {
	nock(fakeUrl)
		.post(url => url.includes("/transactions"), "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAFAAWczYAAAAHAAAAAAAAAAEAAAAQMS1hYWF" +
			"hLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAQAAAABLW7uTR3doVCIuTfFzKnlf3HpeZt2WTHUE6HhL67xsuwAAAAAAAAAAACONkAAAAAAAAAAB7K4of" +
			"AAAAEDCr47RR1bk%2FI1TynPEgn937jX3pPXNyyMHPSAW28CtOIXspWiXV3pQe0xN3eZSz94Y%2BNm5G8f0gCPmXxQXIJ4N")
		.reply(200,
			{
				"_links": {
					"transaction": {
						"href": "https://horizon-testnet.kininfrastructure.com/transactions/708ebb9e3c8890333daca3faa6707b89dc0155f2578314e302f39e7387d2d07c"
					}
				},
				"hash": "708ebb9e3c8890333daca3faa6707b89dc0155f2578314e302f39e7387d2d07c",
				"ledger": 1761321,
				"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAHAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGayhQMZWWRAZyMZd" +
					"sXZ9frZpM+yuKHwAAAABAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAAAAAAAAI42QAAAAAAAAAAHsrih8AAAAQMKY/BIzE+nLdSm27j41TtHb55NgG36Z2wX3cDjAJco9PCxr" +
					"n7rwoFoq/ALjdp/jLitNfefgA6h0+CrGWWEioQE=",
				"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=",
				"result_meta_xdr": "AAAAAAAAAAEAAAAEAAAAAwAaK2EAAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAABWXWAAGiCfAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAA" +
					"AAAAAAAAAAAAQAa4CkAAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAAB56vAAGiCfAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAa4CkAAAAAA" +
					"AAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHSJSQAFnM2AAAABwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAa4CkAAAAAAAAAAG809+MhGZ82rRmsoUDGV" +
					"lkQGcjGXbF2fX62aTPsrih8AAAAALGul5QAFnM2AAAABwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
			});
}
