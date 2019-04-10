import {Server} from "@kinecosystem/kin-sdk";
import * as nock from "nock";
import {KinAccount} from "../../scripts/bin/kinAccount";
import {AccountDataRetriever} from "../../scripts/bin/blockchain/accountDataRetriever";
import {TransactionNotFoundError} from "../../scripts/bin/errors";
import {Environment} from "../../scripts/bin/environment";
import {Network} from "@kinecosystem/kin-base";
import {WhitelistPayload} from "../../scripts/bin/types";
import {BlockchainInfoRetriever} from "../../scripts/bin/blockchain/blockchainInfoRetriever";

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
		expect((txBuilder as any)._transactionBuilder.memo._value).toEqual(memo);
		expect((txBuilder as any)._transactionBuilder.source.id).toEqual(senderPublic);
		expect((txBuilder as any)._transactionBuilder.source.sequence).toEqual("6319125253062661");
		expect(txBuilder.build().toEnvelope().toXDR('base64')).toEqual("AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGayhQMZWWRAZyMZdsXZ9frZpM+yuKHwAAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAADuaygAAAAAAAAAAAA==");
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

	test("create account, error expect 400 ServerError", async () => {
		mockLoadAccountResponse("6319125253062657");
		mock400AccountResponse();

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 10,
			fee: fee,
			memoText: memo
		});
		await expect(kinAccount.submitTransaction(txBuilder)).rejects.toEqual(new TransactionNotFoundError(senderPublic));
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

	test("send kin, error expect 400 ServerError", async () => {
		mockLoadAccountResponse("6319125253062657");
		mock400SendKinResponse();

		const txBuilder = await kinAccount.buildSendKin({
			address: receiverPublic,
			amount: 10,
			fee: fee,
			memoText: memo
		});
		await expect(kinAccount.submitTransaction(txBuilder)).rejects.toEqual(new TransactionNotFoundError(senderPublic));
	});

	test("whitelist transaction - send kin", async () => {
		let envelope = "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAXi3wAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAABAAAAAMn/CFYMgqIVL2JthzKcO+0IQKdG8GGNFDf6BjKHT1KPAAAAAAAAAAAF9eEAAAAAAAAAAAA=";
		const txPair: WhitelistPayload = {envelope: envelope, networkId: Network.current().networkPassphrase()};
		await expect(kinAccount.whitelistTransaction(txPair)).toEqual("AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAXi3wAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAABAAAAAMn/CFYMgqIVL2JthzKcO+0IQKdG8GGNFDf6BjKHT1KPAAAAAAAAAAAF9eEAAAAAAAAAAAHsrih8AAAAQEp6EC/3dO8zMeY33USui59MPIxxLaXsiYWxSVaIX7MwNaocb+NyoR5++eT/GPynxbPKQptftf/JPv2FNev2VwU=");
	});

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

	function mockCreateAccountResponse() {
		nock(fakeUrl)
			.post(url => url.includes("/transactions"), "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGayhQMZWWRAZyMZdsXZ9frZpM%2ByuKHwAAAAAAAAAAG26eLNMNpBm8pc809%2F2LyRtJ6Px1DDUZTtqBWYs9%2FRdAAAAAAAPQkAAAAAAAAAAAeyuKHwAAABAR1kR5lr0GnNYwajx4JJ7W1dnO3Pjl8soKjgKH6AK6c8MgKLEeyh24TJkOKPrxFmnYnr3uhXTPy%2BhJTQv7R6ZCg%3D%3D")
			.reply(200,
				{
					"_links": {
						"transaction": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95"
						}
					},
					"hash": "6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95",
					"ledger": 1761292,
					"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGayhQMZWWRAZyMZdsXZ9frZpM+yuKHwAAAAAAAAAAG26eLNMNpBm8pc809/2LyRtJ6Px1DDUZTtqBWYs9/RdAAAAAAAPQkAAAAAAAAAAAeyuKHwAAABAR1kR5lr0GnNYwajx4JJ7W1dnO3Pjl8soKjgKH6AK6c8MgKLEeyh24TJkOKPrxFmnYnr3uhXTPy+hJTQv7R6ZCg==",
					"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAAa4AwAAAAAAAAAAG26eLNMNpBm8pc809/2LyRtJ6Px1DDUZTtqBWYs9/RdAAAAAAAPQkAAGuAMAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAa4AwAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHhZ8gAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAa4AwAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHSJYgAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
				});
	}

	function mockSendKinResponse() {
		nock(fakeUrl)
			.post(url => url.includes("/transactions"), "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAHAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGayhQMZWWRAZyMZdsXZ9frZpM%2ByuKHwAAAABAAAAAEtbu5NHd2hUIi5N8XMqeV%2Fcel5m3ZZMdQToeEvrvGy7AAAAAAAAAAAAI42QAAAAAAAAAAHsrih8AAAAQMKY%2FBIzE%2BnLdSm27j41TtHb55NgG36Z2wX3cDjAJco9PCxrn7rwoFoq%2FALjdp%2FjLitNfefgA6h0%2BCrGWWEioQE%3D\n")
			.reply(200,
				{
					"_links": {
						"transaction": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/708ebb9e3c8890333daca3faa6707b89dc0155f2578314e302f39e7387d2d07c"
						}
					},
					"hash": "708ebb9e3c8890333daca3faa6707b89dc0155f2578314e302f39e7387d2d07c",
					"ledger": 1761321,
					"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAHAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGayhQMZWWRAZyMZdsXZ9frZpM+yuKHwAAAABAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAAAAAAAAI42QAAAAAAAAAAHsrih8AAAAQMKY/BIzE+nLdSm27j41TtHb55NgG36Z2wX3cDjAJco9PCxrn7rwoFoq/ALjdp/jLitNfefgA6h0+CrGWWEioQE=",
					"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAEAAAAEAAAAAwAaK2EAAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAABWXWAAGiCfAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAa4CkAAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAAB56vAAGiCfAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAa4CkAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHSJSQAFnM2AAAABwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAa4CkAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALGul5QAFnM2AAAABwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
				});
	}

	function mock400AccountResponse() {
		nock(fakeUrl)
			.post(url => url.includes("/transactions"), /tx=\w+/gi)
			.reply(400,
				{
					"type": "https://stellar.org/horizon-errors/transaction_failed",
					"title": "Transaction Failed",
					"status": 400,
					"detail": "The transaction failed when submitted to the stellar network. The `extras.result_codes` field on this response contains further details.  Descriptions of each code can be found at: https://www.stellar.org/developers/learn/concepts/list-of-operations.html",
					"extras": {
						"envelope_xdr": "AAAAAOzY9WfVBnssuWevXxORz2d6Qfig4qWIRzwD1ObqTmkjAAAAZAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAAAAAAAAKSsO2j1EiYi4rydi+K+YdTC2HcWfMoKjHOd0/wIiaozAAAAAAX14QAAAAAAAAAAAepOaSMAAABAjwXKIwLrKSCjdfniUpIMlUIJCKOgGOIgbbHglPfXXqTVQslY8jm+/gg0paO2MMox/2QXuucftQktxZ3ni69LDA==",
						"result_codes": {
							"transaction": "tx_bad_seq"
						},
						"result_xdr": "AAAAAAAAAAD////7AAAAAA=="
					}
				});
	}

	function mock400SendKinResponse() {
		nock(fakeUrl)
			.post(url => url.includes("/transactions"), /tx=\w+/gi)
			.reply(400,
				{
					"type": "https://stellar.org/horizon-errors/transaction_failed",
					"title": "Transaction Failed",
					"status": 400,
					"detail": "The transaction failed when submitted to the stellar network. The `extras.result_codes` field on this response contains further details.  Descriptions of each code can be found at: https://www.stellar.org/developers/learn/concepts/list-of-operations.html",
					"extras": {
						"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAXi3wAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAALGk81+NzKnst96N+pghxVE61OL/ZTzDk7HfJKdHPJJ0AAAAAAAAAAAAmJaAAAAAAAAAAAHsrih8AAAAQMVoAvHh39F3G4kWnaa/JWBPaoDgFLyND5s0mw3waQTiU7cp1eZ64N+ZrY2lRn9B4YinNMqfWauQjviJdPHOdwc=",
						"result_codes": {
							"transaction": "tx_bad_seq"
						},
						"result_xdr": "AAAAAAAAAAD////7AAAAAA=="
					}
				});
	}
});
