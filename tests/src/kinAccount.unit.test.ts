import * as nock from "nock";

import {KinAccount} from "../../scripts/src/kinAccount";
import {AccountDataRetriever} from "../../scripts/src/blockchain/accountDataRetriever";
import {BadRequestError, ErrorDecoder, ErrorResponse, LowBalanceError} from "../../scripts/src/errors";
import {Environment} from "../../scripts/src/environment";
import {Memo, Network, Operation} from "@kinecosystem/kin-base";
import {WhitelistPayload} from "../../scripts/src/types";
import {BlockchainInfoRetriever} from "../../scripts/src/blockchain/blockchainInfoRetriever";
import {Server} from "@kinecosystem/kin-sdk";
import {GLOBAL_RETRY, MEMO_LENGTH_ERROR} from "../../scripts/src/config";
import CreateAccount = Operation.CreateAccount;
import {TransactionRetriever} from "../../scripts/src/blockchain/transactionRetriever";
import {CreateAccountTransaction, PaymentTransaction} from "../../scripts/src";

const horizonUrl = "http://horizon.com";
const headerKey = "user-agent";
const headerVal = "test-kin";

const mock500NetworkResponse: ErrorResponse = {
	"type": "https://stellar.org/horizon-errors/server_error",
	"title": "Internal server Error",
	"status": 500,
	"detail": "Internal server Error."
};
const senderSeed = "SBVYIBM6UTDHMN7RN6VVEFKABRQBW3YB7W7RYFZFTBD6YX3IDFLS7NGW";
const senderPublic = "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65";
const receiverPublic = "GBFVXO4TI53WQVBCFZG7C4ZKPFP5Y6S6M3OZMTDVATUHQS7LXRWLWF5S";
const receiverPublic_2 = "GBW3U6FTJQ3JAZXSS46NHX7WF4SG2J5D6HKDBVDFHNVAKZRM672F2GDP";
const transactionId = "6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95";
const appId = "aaaa";
const amount: number = 100;
const memo = "test memo";
let kinAccount: KinAccount;

const bodySendKin = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAFAAWczYAAAAHAAAAAAAAAAEAAAAQMS1hYWFhL" +
	"XRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAQAAAABLW7uTR3doVCIuTfFzKnlf3HpeZt2WTH" +
	"UE6HhL67xsuwAAAAAAAAAAACONkAAAAAAAAAAB7K4ofAAAAEDCr47RR1bk%2FI1TynPEgn937jX3pPXNyyMHPSAW28CtOIXspWiXV3pQe0xN3eZSz94" +
	"Y%2BNm5G8f0gCPmXxQXIJ4N";

const bodySendKin_2 = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAHAAAAAAAAAAEAAAAQ" +
	"MS1hYWFhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAQAAAABLW7uTR3doVCIuTfFzKnlf3" +
	"HpeZt2WTHUE6HhL67xsuwAAAAAAAAAAACONkAAAAAAAAAAB7K4ofAAAAECVwez0u84Tk%2BNbQbh5srOCmYv4vE81P23nW6uy1oQAhpTuwJ%2Bm0Lbp" +
	"rWH9GGUl3zZV%2FZYcM9ghOJBRyZ55glcO";

const bodySendKin_3 = "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAXi3wAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAQAAAAAAAAABAAAAALGk81+NzKnst96N+pghxVE61OL/ZTzDk7HfJKdHPJJ0AAAAAAAAAAAAmJaAAAAAAAAAAAHsrih8AAAAQMVoAvHh39F3G4kW" +
	"naa/JWBPaoDgFLyND5s0mw3waQTiU7cp1eZ64N+ZrY2lRn9B4YinNMqfWauQjviJdPHOdwc=";

const bodyMissingMemoCreateAccount = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAA" +
	"AAHMS1hYWFhLQAAAAABAAAAAQAAAABvNPfjIRmfNq0ZrKFAxlZZEBnIxl2xdn1%2Btmkz7K4ofAAAAAAAAAAAbbp4s0w2kGbylzzT3%2FYvJG0no%2F" +
	"HUMNRlO2oFZiz39F0AAAAAAA9CQAAAAAAAAAAB7K4ofAAAAEAme%2F5beR7kQm9B%2B1b9CLd9swfG3dHLml0QRG72pOuOkqDAgIB%2BmryTtl4m7BY" +
	"M5SXNqjq80XPxgrTvfzPY%2F6oP";

const bodyCreateAccountRedirect = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAHAAAAAAAAAAEAAAAQ" +
	"MS1hYWFhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAQAAAABLW7uTR3doVCIuTfFzKnlf3" +
	"HpeZt2WTHUE6HhL67xsuwAAAAAAAAAAACONkAAAAAAAAAAB7K4ofAAAAECVwez0u84Tk%2BNbQbh5srOCmYv4vE81P23nW6uy1oQAhpTuwJ%2Bm0Lbp" +
	"rWH9GGUl3zZV%2FZYcM9ghOJBRyZ55glcO";

const bodyCreatAccount = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAQMS1hYWFhL" +
	"XRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAAAABtunizTDaQZvKXPNPf9i8kbSej8dQw1G" +
	"U7agVmLPf0XQAAAAAAD0JAAAAAAAAAAAHsrih8AAAAQAcqtM7IY%2FdojHCYDZHlGyU9khht6BmyFnYyffwcXgQXuYRyRbIEZFKawz4jQznYVSgQQnH" +
	"SoYqHtaO0J%2BVLmwA%3D";

const bodyCreatAccount_2 = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAACgAWczYAAAAGAAAAAAAAAAEAAAAQMS1hYWF" +
	"hLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAAAABLW7uTR3doVCIuTfFzKnlf3HpeZt2W" +
	"THUE6HhL67xsuwAAAAA7msoAAAAAAAAAAAHsrih8AAAAQIbUcMf2hOWK42YlO8cWIGnZIYuTPj739NhH8WeB5mIEgaNfwyrWvdNUkAInnNoTGu6DdbM" +
	"ky5izo9QEgLeZ0gg%3D";

const bodyCreateAccount_3 = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAQMS1hYW" +
	"FhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAAAABtunizTDaQZvKXPNPf9i8kbSej8dQ" +
	"w1GU7agVmLPf0XQAAAAAAD0JAAAAAAAAAAAHsrih8AAAAQAcqtM7IY%2FdojHCYDZHlGyU9khht6BmyFnYyffwcXgQXuYRyRbIEZFKawz4jQznYVSgQ" +
	"QnHSoYqHtaO0J%2BVLmwA%3D";

const bodyCreateAccount4 = "AAAAAOzY9WfVBnssuWevXxORz2d6Qfig4qWIRzwD1ObqTmkjAAAAZAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAA" +
	"AAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAAAAAAAAKSsO2j1EiYi4rydi+K+YdTC2HcWfMoKjHOd0/wIiaozAAAAAAX14QAAAAAAAAAAAepOaSMAAAB" +
	"AjwXKIwLrKSCjdfniUpIMlUIJCKOgGOIgbbHglPfXXqTVQslY8jm+/gg0paO2MMox/2QXuucftQktxZ3ni69LDA==";

const response400: ErrorResponse = {
	type: "https://stellar.org/horizon-errors/transaction_failed",
	title: "Transaction Failed",
	status: 400,
	detail: "The transaction failed when submitted to the stellar network. The `extras.result_codes` field on this" +
		" response contains further details.  Descriptions of each code can be found at: https://www.stellar.org" +
		"/developers/learn/concepts/list-of-operations.html",
	extras: {
		result_codes: {},
		result_xdr: "AAAAAAAAAAD////7AAAAAA=="
	}
};

describe("KinAccount.createAccount", async () => {
	let retryDelay = 1;
	let testRetry;
	beforeEach(async () => {
		testRetry = {
			retries: GLOBAL_RETRY.retries,
			retryDelay: (count: any): number => {
				return retryDelay *= count;
			}
		};
		const server = new Server(horizonUrl, {
			allowHttp: true,
			headers: new Map<string, string>().set(headerKey, headerVal),
			retry: testRetry
		});
		const accountDataRetriever = new AccountDataRetriever(server);
		Network.use(new Network(Environment.Testnet.passphrase));
		kinAccount = new KinAccount(senderSeed, accountDataRetriever, server, new BlockchainInfoRetriever(server), appId);
		nock.cleanAll();
	});

	test("builder transaction, create account succeed", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockTransactionRequest({requestBody: bodyCreatAccount_2});

		const txBuilder = await kinAccount.getTransactionBuilder({
			fee: amount
		});
		txBuilder.addFee(10);
		txBuilder.addMemo(Memo.text(memo));
		txBuilder.addOperation(Operation.createAccount({
			source: senderPublic,
			destination: receiverPublic,
			startingBalance: "10000"
		}));
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual(transactionId);
	});

	test("build create account with 0", async () => {
		mockLoadAccountResponse("6319125253062661");

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 0,
			fee: amount
		});
		const transaction = txBuilder.build();
		expect((transaction.operations[0] as CreateAccount).startingBalance).toEqual("0");
	});

	test("account created build transaction", async () => {
		mockLoadAccountResponse("6319125253062661");

		const txBuilder = await kinAccount.buildCreateAccount(
			{
				address: receiverPublic,
				startingBalance: 10000,
				fee: amount,
				memoText: memo
			});
		expect((txBuilder as any)._transactionBuilder.baseFee).toEqual(amount);
		expect((txBuilder as any)._transactionBuilder.memo._value).toEqual("1-" + appId + "-" + memo);
		expect((txBuilder as any)._transactionBuilder.source.id).toEqual(senderPublic);
		expect((txBuilder as any)._transactionBuilder.source.sequence).toEqual("6319125253062661");
		expect(txBuilder.build().toEnvelope().toXDR("base64")).toEqual("AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aT" +
			"Psrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAQMS1hYWFhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2f" +
			"X62aTPsrih8AAAAAAAAAABLW7uTR3doVCIuTfFzKnlf3HpeZt2WTHUE6HhL67xsuwAAAAA7msoAAAAAAAAAAAA=");
	});

	test("create account, send transaction succeed", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockTransactionRequest({requestBody: bodyCreatAccount});

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic_2,
			startingBalance: 10,
			fee: amount,
			memoText: memo
		});
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual(transactionId);
	});

	test("create account, throw error - memo is too long", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockTransactionRequest({requestBody: bodyCreatAccount});

		await expect(kinAccount.buildCreateAccount({
			address: receiverPublic_2,
			startingBalance: 10,
			fee: amount,
			memoText: "Test minimum length is working"
		})).rejects.toEqual(new Error(MEMO_LENGTH_ERROR));
	});

	test("create account tx_insufficient_balance, error expect 400 ServerError", async () => {
		const response: ErrorResponse = response400;
		response.extras.envelope_xdr = bodyCreateAccount4;
		response.extras.result_codes.transaction = "tx_insufficient_balance";

		mockLoadAccountResponse("6319125253062657");
		mockErrorResponse(response);

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 10,
			fee: amount,
			memoText: memo
		});
		await expect(kinAccount.submitTransaction(txBuilder)).rejects.toEqual(new LowBalanceError(response));
	});

	test("create account tx_bad_seq, error expect 400 ServerError", async () => {
		const response: ErrorResponse = response400;
		response.extras.envelope_xdr = bodyCreateAccount4;
		response.extras.result_codes.transaction = "tx_bad_seq";

		mockLoadAccountResponse("6319125253062657");
		mockErrorResponse(response);

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 10,
			fee: amount,
			memoText: memo
		});
		await expect(kinAccount.submitTransaction(txBuilder)).rejects.toEqual(new BadRequestError(response));
	});

	test("send kin", async () => {
		mockLoadAccountResponse("6319125253062662");
		mockTransactionRequest({requestBody: bodySendKin_2});

		const txBuilder = await kinAccount.buildSendKin({
			address: receiverPublic,
			amount: 23.3,
			fee: amount,
			memoText: memo
		});
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual(transactionId);
	});

	test("test get proxy redirect", async () => {
		const fakeUrl = "https://fake.url.com";
		nock(horizonUrl)
			.get(url => url.includes(senderPublic))
			.reply(307, undefined, {location: fakeUrl + "/accounts/" + senderPublic});
		mockLoadAccountResponse("6319125253062661", {url: fakeUrl});

		const createBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 0,
			fee: amount
		});
		const transaction = createBuilder.build();
		expect((transaction.operations[0] as CreateAccount).startingBalance).toEqual("0");
	});

	test("test retry with get proxy redirect", async () => {
		const fakeUrl = "https://fake.url.com";
		nock(horizonUrl)
			.get(url => url.includes(senderPublic))
			.reply(307, undefined, {location: fakeUrl + "/accounts/" + senderPublic});
		mockLoadAccountResponse("6319125253062661", {retry: 2});

		const createBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 0,
			fee: amount
		});
		const transaction = createBuilder.build();
		expect(transaction.sequence).toEqual("6319125253062662");
	});

	test("test post proxy redirect", async () => {
		const fakeUrl = "https://fake.url.com";
		mockLoadAccountResponse("6319125253062661");
		nock(horizonUrl)
			.post(url => true)
			.reply(307, undefined, {
				location: fakeUrl + "/transactions/" + bodyCreateAccountRedirect
			});
		mockTransactionRequest({url: fakeUrl, requestBody: bodyCreateAccount_3});

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic_2,
			startingBalance: 10,
			fee: amount
		});
		txBuilder.addMemo(Memo.text(memo));
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual(transactionId);
	});

	test("test retry with post proxy redirect", async () => {
		const fakeUrl = "https://fake.url.com";
		mockLoadAccountResponse("6319125253062661");
		nock(horizonUrl)
			.post(url => url.includes(senderPublic))
			.reply(307, undefined, {
				location: fakeUrl + "/transactions/" + bodyCreateAccountRedirect
			});
		mockTransactionRequest({retry: 3, requestBody: bodyCreatAccount});

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic_2,
			startingBalance: 10,
			fee: amount
		});
		txBuilder.addMemo(Memo.text(memo));
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual(transactionId);
	});

	test("send kin, error expect 400 ServerError. when error tx_bad_seq expect BadRequestError", async () => {
		const response: ErrorResponse = response400;
		response.extras.envelope_xdr = bodySendKin_3;
		response.extras.result_codes.transaction = "tx_bad_seq";

		mockLoadAccountResponse("6319125253062657");
		mockErrorResponse(response);

		const txBuilder = await kinAccount.buildSendKin({
			address: receiverPublic,
			amount: 10,
			fee: amount,
			memoText: memo
		});
		await expect(kinAccount.submitTransaction(txBuilder)).rejects.toEqual(new BadRequestError(response));
	});

	test("whitelist transaction - send kin", async () => {
		const data = "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAXi3wAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAA" +
			"AAB2JsYSBibGEAAAAAAQAAAAAAAAABAAAAAMn/CFYMgqIVL2JthzKcO+0IQKdG8GGNFDf6BjKHT1KPAAAAAAAAAAAF9eEAAAAAAAAAAAA=";
		const txPair: WhitelistPayload = {envelope: data, networkId: Network.current().networkPassphrase()};
		await expect(kinAccount.whitelistTransaction(txPair)).toEqual("AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8A" +
			"AAAAAAXi3wAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAABAAAAAMn/CFYMgqIVL2JthzKcO+0I" +
			"QKdG8GGNFDf6BjKHT1KPAAAAAAAAAAAF9eEAAAAAAAAAAAHsrih8AAAAQEp6EC/3dO8zMeY33USui59MPIxxLaXsiYWxSVaIX7MwNaocb+N" +
			"yoR5++eT/GPynxbPKQptftf/JPv2FNev2VwU=");
	});

	test("create account without memo", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockTransactionRequest({requestBody: bodyMissingMemoCreateAccount});

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic_2,
			startingBalance: 10,
			fee: amount
		});
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual(transactionId);
	});

	test("create account, add memo", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockTransactionRequest({requestBody: bodyCreatAccount});

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic_2,
			startingBalance: 10,
			fee: amount
		});
		txBuilder.addMemo(Memo.text(memo));
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual(transactionId);
	});

	test("send kin, change fee before submitting transaction", async () => {
		mockLoadAccountResponse("6319125253062662");
		mockTransactionRequest({requestBody: bodySendKin});

		const txBuilder = await kinAccount.buildSendKin({
			address: receiverPublic,
			amount: 23.3,
			fee: amount,
			memoText: memo
		});
		txBuilder.addFee(20);
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual(transactionId);
	});

	test("retry send kin, change fee before submitting transaction.", async () => {
		mockLoadAccountResponse("6319125253062662");
		mockTransactionRequest({retry: 3, requestBody: bodySendKin});

		const txBuilder = await kinAccount.buildSendKin({
			address: receiverPublic,
			amount: 23.3,
			fee: amount,
			memoText: memo
		});
		txBuilder.addFee(20);
		expect(await kinAccount.submitTransaction(txBuilder)).toEqual(transactionId);
		expect(retryDelay).toEqual(6);
	});

	test("retry send kin, error 500 ServerError.", async () => {
		mockLoadAccountResponse("6319125253062662");
		mockFailedRetries(6);

		const txBuilder = await kinAccount.buildSendKin({
			address: receiverPublic,
			amount: 23.3,
			fee: amount,
			memoText: memo
		});
		txBuilder.addFee(20);
		await expect(kinAccount.submitTransaction(txBuilder)).rejects.toEqual(ErrorDecoder.translate({response: mock500NetworkResponse}));
	}, 120000);

	test("decode transaction, creaate account", async () => {
		const envCreateAccount = "AAAAAJgYN4A6gJqythoF+KrosLoDT0z7xDUd7ZNopGmsL1mrAAAAZAATihkAAAABAAAAAQAAAAAAAAAAAAAAAA" +
			"AAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAfKjvdav7L3Xvs514g5E86dPE9EMSLLV1vTOrVHRAFIAAAAAAX14QAAAAAAAAAAAA==";
		const transaction = TransactionRetriever.fromTransactionPayload(envCreateAccount);

		expect(transaction.fee).toBe(100);
		expect(transaction.hash).toBe("73cHToe2X8uunnnrr+JwMNte90RlvmCVDlddwVSwrQA=");
		expect(transaction.sequence).toBe(5499864536317953);
		expect(transaction.source).toBe("GCMBQN4AHKAJVMVWDIC7RKXIWC5AGT2M7PCDKHPNSNUKI2NMF5M2XTCJ");
		expect(transaction.type).toBe("CreateAccountTransaction");
		expect((transaction as CreateAccountTransaction).destination).toBe("GAD4VDXXLK73F5267M45PCBZCPHJ2PCPIQYSFS2XLPJTVNKHIQAURDJS");
		expect((transaction as CreateAccountTransaction).startingBalance).toBe(1000);
	});

	test("decode transaction, creaate account", async () => {
		const envPayment = "AAAAAJgYN4A6gJqythoF+KrosLoDT0z7xDUd7ZNopGmsL1mrAAAAZAATihkAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAA" +
			"AAABAAAADlRlc3QgdHJhbnNsYXRlAAAAAAABAAAAAAAAAAEAAAAAB8qO91q/svde+znXiDkTzp08T0QxIstXW9M6tUdEAUgAAAAAAAAAAAC" +
			"YloAAAAAAAAAAAA==";
		const transaction = TransactionRetriever.fromTransactionPayload(envPayment);

		expect(transaction.fee).toBe(100);
		expect(transaction.hash).toBe("2QOrZ5DtDful+dxWHAjWn7D6w25Q/K70mlpEc5RkKsY=");
		expect(transaction.sequence).toBe(5499864536317953);
		expect(transaction.source).toBe("GCMBQN4AHKAJVMVWDIC7RKXIWC5AGT2M7PCDKHPNSNUKI2NMF5M2XTCJ");
		expect(transaction.type).toBe("PaymentTransaction");
		expect((transaction as PaymentTransaction).destination).toBe("GAD4VDXXLK73F5267M45PCBZCPHJ2PCPIQYSFS2XLPJTVNKHIQAURDJS");
		expect((transaction as PaymentTransaction).amount).toBe(100);
	});
});

function mockFailedRetries(retries: number) {
	const builder = nock(horizonUrl)
		.matchHeader(headerKey, headerVal);
	for (let i = 0; i < retries; i++) {
		builder.post(url => true).reply(mock500NetworkResponse.status, mock500NetworkResponse);
	}
}

function mockErrorResponse(response: ErrorResponse) {
	nock(horizonUrl)
		.matchHeader(headerKey, headerVal)
		.post(url => url.includes("/transactions"), /tx=\w+/gi)
		.reply(response.status, response);
}

function mockLoadAccountResponse(sequence: string, options?: { url?: string, retry?: number }) {
	const builder = nock(options && options.url ? options.url : horizonUrl)
		.matchHeader(headerKey, headerVal);
	if (options && options.retry && options.retry > 0) {
		for (let i = 0; i < options.retry; i++) {
			builder.get(url => true).reply(mock500NetworkResponse.status, mock500NetworkResponse);
		}
	}
	builder
		.get(url => url.includes(senderPublic))
		.reply(200,
			{
				"_links": {
					"self": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65"
					},
					"transactions": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/transactions{?cursor,limit,order}",
						"templated": true
					},
					"operations": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/operations{?cursor,limit,order}",
						"templated": true
					},
					"payments": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/payments{?cursor,limit,order}",
						"templated": true
					},
					"effects": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/effects{?cursor,limit,order}",
						"templated": true
					},
					"offers": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/offers{?cursor,limit,order}",
						"templated": true
					},
					"trades": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/trades{?cursor,limit,order}",
						"templated": true
					},
					"data": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/data/{key}",
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

function mockTransactionRequest(options: { url?: string, retry?: number, requestBody: string, hash?: string }) {
	const builder = nock(options && options.url ? options.url : horizonUrl)
		.matchHeader(headerKey, headerVal);
	if (options && options.retry && options.retry > 0) {
		for (let i = 0; i < options.retry; i++) {
			builder.get(url => true).reply(mock500NetworkResponse.status, mock500NetworkResponse);
		}
	}
	builder
		.post(url => url.includes("/transactions"), options.requestBody)
		.reply(200,
			{
				"_links": {
					"transaction": {
						"href": "https://horizon-testnet.kininfrastructure.com/transactions/" + transactionId
					}
				},
				"hash": transactionId,
				"ledger": 1761292,
				"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAJdGVzdCB" +
					"tZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGayhQMZWWRAZyMZdsXZ9frZpM+yuKHwAAAAAAAAAAG26eLNMNpBm8pc809/2Ly" +
					"RtJ6Px1DDUZTtqBWYs9/RdAAAAAAAPQkAAAAAAAAAAAeyuKHwAAABAR1kR5lr0GnNYwajx4JJ7W1dnO3Pjl8soKjgKH6AK6c8Mg" +
					"KLEeyh24TJkOKPrxFmnYnr3uhXTPy+hJTQv7R6ZCg==",
				"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
				"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAAa4AwAAAAAAAAAAG26eLNMNpBm8pc809/2LyRtJ6Px1DDUZTtqBWYs9/RdAAAA" +
					"AAAPQkAAGuAMAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAa4AwAAAAAAAAAAG809+MhGZ82rRmsoUD" +
					"GVlkQGcjGXbF2fX62aTPsrih8AAAAALHhZ8gAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAa4A" +
					"wAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHSJYgAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABA" +
					"AAAAAAAAAAAAAAAAAAA"
			});
}
