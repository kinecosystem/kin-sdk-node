import {Keypair, Server} from "@kinecosystem/kin-sdk";
import * as nock from "nock";
import {KinAccount} from "../../scripts/src/KinAccount";
import {AccountDataRetriever} from "../../scripts/src/blockchain/accountDataRetriever";
import {TransactionNotFoundError} from "../../scripts/src/errors";
import {IWhitelistPair} from "../../scripts/src/types";
import {Environment} from "../../scripts/bin/environment";
import {Network} from "@kinecosystem/kin-base";
const fakeUrl = "http://horizon.com";
const server = new Server(fakeUrl, {allowHttp: true});
const accountDataRetriever = new AccountDataRetriever(server);
const senderSeed = "SBVYIBM6UTDHMN7RN6VVEFKABRQBW3YB7W7RYFZFTBD6YX3IDFLS7NGW";
const senderPublic = "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65";
const receiverPublic = "GDE76CCWBSBKEFJPMJWYOMU4HPWQQQFHI3YGDDIUG75AMMUHJ5JI67MV";
const appId = "aaaa";
const startingBalance = 10000;
const fee = 1;
const whitelistFee = 0;
let kinAccount: KinAccount;


describe("KinAccount.createAccount", async () => {
	beforeAll(async () => {
		Network.use(new Network(Environment.Testnet.passphrase));
		kinAccount = new KinAccount(senderSeed, accountDataRetriever, server, appId);
	});

	test("account created", async () => {
		mockLoadAccountResponse()
		mockCreateAccountResponse()

		const txBuilder = await kinAccount.buildCreateAccount(receiverPublic, startingBalance, fee, "bla bla");
		await expect(kinAccount.submitTx(txBuilder)).toBeDefined();
	});

	test("create account, error expect 400 ServerError", async () => {
		mockLoadAccountResponse()
		mock400AccountResponse()

		const txBuilder = await kinAccount.buildCreateAccount(receiverPublic, startingBalance, fee, "bla bla");
		await expect(kinAccount.submitTx(txBuilder)).rejects.toEqual(new TransactionNotFoundError(senderPublic));
	});

	test("send kin", async () => {
		mockLoadAccountResponse()
		mockSendKinResponse()

		const txBuilder = await kinAccount.buildSendKin(receiverPublic, startingBalance, fee, "bla bla");
		await expect(kinAccount.submitTx(txBuilder)).toBeDefined();
	});

	test("send kinb, error expect 400 ServerError", async () => {
		mockLoadAccountResponse()
		mock400SendKinResponse()

		const txBuilder = await kinAccount.buildSendKin(receiverPublic, startingBalance, fee, "bla bla");
		await expect(kinAccount.submitTx(txBuilder)).rejects.toEqual(new TransactionNotFoundError(senderPublic));
	});

	test("whitelist transaction - send kin", async () => {
		let envelope = "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAXi3wAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAABAAAAAMn/CFYMgqIVL2JthzKcO+0IQKdG8GGNFDf6BjKHT1KPAAAAAAAAAAAF9eEAAAAAAAAAAAA=";
		const txPair: IWhitelistPair = {envelope: envelope, networkId: Network.current().networkPassphrase()};
		await expect(kinAccount.whitelistTransaction(txPair)).toEqual("AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAXi3wAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAABAAAAAMn/CFYMgqIVL2JthzKcO+0IQKdG8GGNFDf6BjKHT1KPAAAAAAAAAAAF9eEAAAAAAAAAAAHsrih8AAAAQEp6EC/3dO8zMeY33USui59MPIxxLaXsiYWxSVaIX7MwNaocb+NyoR5++eT/GPynxbPKQptftf/JPv2FNev2VwU=");
	});

	function mockLoadAccountResponse() {
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
					"sequence": "6627289156550656",
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
							"balance": "10000.00000",
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
				});
	}

	function mockCreateAccountResponse() {
		nock(fakeUrl)
			.post(url => url.includes("/transactions"), /tx=\w+/gi)
			.reply(200,
				{
					"_links": {
						"transaction": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/d0158b2d2822bd6df624b486243cf72f6a825b09cec2505068fcfe9e90636ebb"
						}
					},
					"hash": "d0158b2d2822bd6df624b486243cf72f6a825b09cec2505068fcfe9e90636ebb",
					"ledger": 1559337,
					"envelope_xdr": "AAAAAOzY9WfVBnssuWevXxORz2d6Qfig4qWIRzwD1ObqTmkjAAAAZAAXxzUAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAAAAAAAAKSsO2j1EiYi4rydi+K+YdTC2HcWfMoKjHOd0/wIiaozAAAAAAX14QAAAAAAAAAAAepOaSMAAABASMTnIg0cJ+JbMOIq7Kg+2E6ThSzNaOTmFFLD+D5say+egiKgYrOiLeD6f3X60ixbbcTvfqVrrjCbAbCxYK+cDg==",
					"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAAXyykAAAAAAAAAAKSsO2j1EiYi4rydi+K+YdTC2HcWfMoKjHOd0/wIiaozAAAAAAX14QAAF8spAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAXyykAAAAAAAAAAOzY9WfVBnssuWevXxORz2d6Qfig4qWIRzwD1ObqTmkjAAAAADuayZwAF8c1AAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAXyykAAAAAAAAAAOzY9WfVBnssuWevXxORz2d6Qfig4qWIRzwD1ObqTmkjAAAAADWk6JwAF8c1AAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
				});
	}

	function mockSendKinResponse() {
		nock(fakeUrl)
			.post(url => url.includes("/transactions"), /tx=\w+/gi)
			.reply(200,
				{
					"_links": {
						"transaction": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/9aa6057204241b838e76cbad8ff2fabcf2dcf917798a92d2a3270ea95f869445"
						}
					},
					"hash": "9aa6057204241b838e76cbad8ff2fabcf2dcf917798a92d2a3270ea95f869445",
					"ledger": 1574256,
					"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAALGk81+NzKnst96N+pghxVE61OL/ZTzDk7HfJKdHPJJ0AAAAAAAAAAAAmJaAAAAAAAAAAAHsrih8AAAAQHKrYwUaI2ySel6lANYaR64Id89qi05guyxS/gypgBqX9WpDaqXbOOzFNpANhBhpMOEvp9p441MjCJT4NPPXfQI=",
					"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAEAAAAEAAAAAwAYBXAAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAADuayZwAFnM2AAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAYBXAAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAADsCMxwAFnM2AAAAAQAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAYA1EAAAAAAAAAALGk81+NzKnst96N+pghxVE61OL/ZTzDk7HfJKdHPJJ0AAAAAAX14QAAGANRAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAYBXAAAAAAAAAAALGk81+NzKnst96N+pghxVE61OL/ZTzDk7HfJKdHPJJ0AAAAAAaOd4AAGANRAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
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
