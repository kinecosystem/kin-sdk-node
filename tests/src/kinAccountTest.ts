import {Server} from "@kinecosystem/kin-sdk";
import * as nock from "nock";
import {KinAccount} from "../../scripts/bin/KinAccount";
import {AccountDataRetriever} from "../../scripts/bin/blockchain/accountDataRetriever";
import {TransactionNotFoundError} from "../../scripts/bin/errors";
import {Environment} from "../../scripts/bin/environment";
import {Network} from "@kinecosystem/kin-base";
import {WhitelistPayload} from "../../scripts/bin/types";

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
		kinAccount = new KinAccount(senderSeed, accountDataRetriever, server, appId);
	});

	test("account created build transaction", async () => {
		mockLoadAccountResponse("6319125253062657");

		const txBuilder = await kinAccount.buildCreateAccount(receiverPublic, 10000, fee, memo);
		expect((txBuilder as any)._transactionBuilder.baseFee).toEqual(fee);
		expect((txBuilder as any)._transactionBuilder.memo._value).toEqual(memo);
		expect((txBuilder as any)._transactionBuilder.source.id).toEqual(senderPublic);
		expect((txBuilder as any)._transactionBuilder.source.sequence).toEqual("6319125253062657");
		expect(txBuilder.build().toEnvelope().toXDR('base64')).toEqual("AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAACAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAAAAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAADuaygAAAAAAAAAAAA==");
	});

	test("account created sign transaction", async () => {
		mockLoadAccountResponse("6319125253062658");
		mockCreateAccountResponse();

		const txBuilder = await kinAccount.buildCreateAccount(receiverPublic, 10, fee, memo);
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual("f83c4fcf4501912bee69f1adef7f574e387e5b649f8eea17caf5f53220fa04d8");
	});

	test("create account, error expect 400 ServerError", async () => {
		mockLoadAccountResponse("6319125253062657");
		mock400AccountResponse();

		const txBuilder = await kinAccount.buildCreateAccount(receiverPublic, 10, fee, memo);
		await expect(kinAccount.submitTransaction(txBuilder)).rejects.toEqual(new TransactionNotFoundError(senderPublic));
	});

	test("send kin", async () => {
		mockLoadAccountResponse("6319125253062659");
		mockSendKinResponse();

		const txBuilder = await kinAccount.buildSendKin(receiverPublic, 23.3, fee, memo);
		const temp = await kinAccount.submitTransaction(txBuilder);
		expect(temp).toEqual("4802a3cddcc9eb9a031d420b4b12f8facfe12af43338290cde9fbfad97edf6ff");
	});

	test("send kin, error expect 400 ServerError", async () => {
		mockLoadAccountResponse("6319125253062657");
		mock400SendKinResponse();

		const txBuilder = await kinAccount.buildSendKin(receiverPublic, 10, fee, memo);
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
			.post(url => url.includes("/transactions"), "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAADAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAAAAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV%2Fcel5m3ZZMdQToeEvrvGy7AAAAAAAPQkAAAAAAAAAAAeyuKHwAAABAVMacSioEy6ZhZrI0OYns9GgHziu9Rqv%2BMm0ZtJnViHtPEn0aznGAqm2Enyv0Xqw5613Lwpzh1SJx3crFrP59DQ%3D%3D")
			.reply(200,
				{
					"_links": {
						"transaction": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/f83c4fcf4501912bee69f1adef7f574e387e5b649f8eea17caf5f53220fa04d8"
						}
					},
					"hash": "f83c4fcf4501912bee69f1adef7f574e387e5b649f8eea17caf5f53220fa04d8",
					"ledger": 1712287,
					"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAADAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAAAAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAAAPQkAAAAAAAAAAAeyuKHwAAABAVMacSioEy6ZhZrI0OYns9GgHziu9Rqv+Mm0ZtJnViHtPEn0aznGAqm2Enyv0Xqw5613Lwpzh1SJx3crFrP59DQ==",
					"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAAaIJ8AAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAAAPQkAAGiCfAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAaIJ8AAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAHac/FQAFnM2AAAAAwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAaIJ8AAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAHaNuhQAFnM2AAAAAwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
				});
	}

	function mockSendKinResponse() {
		nock(fakeUrl)
			.post(url => url.includes("/transactions"), "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAEAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAAAAAABAAAAAEtbu5NHd2hUIi5N8XMqeV%2Fcel5m3ZZMdQToeEvrvGy7AAAAAAAAAAAAI42QAAAAAAAAAAHsrih8AAAAQM6LcQOUrtMHSZCZVnGudCcHMLQ%2BBwAIs%2Bf7LL%2Fr0GuTU5eOudNsUUtX1CasM38CkoyW0eZ8uUpVbctEFsIfJQM%3D")
			.reply(200,
				{
					"_links": {
						"transaction": {
							"href": "https://horizon-testnet.kininfrastructure.com/transactions/4802a3cddcc9eb9a031d420b4b12f8facfe12af43338290cde9fbfad97edf6ff"
						}
					},
					"hash": "4802a3cddcc9eb9a031d420b4b12f8facfe12af43338290cde9fbfad97edf6ff",
					"ledger": 1712380,
					"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAEAAAAAAAAAAEAAAAJdGVzdCBtZW1vAAAAAAAAAQAAAAAAAAABAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAAAAAAAAI42QAAAAAAAAAAHsrih8AAAAQM6LcQOUrtMHSZCZVnGudCcHMLQ+BwAIs+f7LL/r0GuTU5eOudNsUUtX1CasM38CkoyW0eZ8uUpVbctEFsIfJQM=",
					"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=",
					"result_meta_xdr": "AAAAAAAAAAEAAAAEAAAAAwAaIJ8AAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAAAPQkAAGiCfAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAaIPwAAAAAAAAAAEtbu5NHd2hUIi5N8XMqeV/cel5m3ZZMdQToeEvrvGy7AAAAAAAyz9AAGiCfAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAaIPwAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAHaNubAAFnM2AAAABAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAaIPwAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAHZqLCAAFnM2AAAABAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA"
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
