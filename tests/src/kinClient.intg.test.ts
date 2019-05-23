import {KinAccount} from "../../scripts/src/kinAccount";
import {Environment} from "../../scripts/src/environment";
import {KeyPair, KinClient} from "../../scripts/src";
import {TransactionBuilder} from "../../scripts/src/blockchain/transactionBuilder";

const keypair = KeyPair.generate();
const seconedKeypair = KeyPair.generate();
let client: KinClient;
let account: KinAccount;
let account2: KinAccount;

describe("KinClient", async () => {
	beforeAll(async () => {
		client = new KinClient(Environment.Testnet);
		account = client.createKinAccount({seed: keypair.seed});
		account2 = client.createKinAccount({seed: seconedKeypair.seed});
		const transactionId = await client.friendbot({address: keypair.publicAddress, amount: 10000});
		const secondtransactionId = await client.friendbot({address: seconedKeypair.publicAddress, amount: 10000});
		expect(transactionId).toBeDefined();
		expect(secondtransactionId).toBeDefined();
	}, 30000);

	test("Create account with friend bot", async () => {
		const data = await client.getAccountData(keypair.publicAddress);

		expect(await client.isAccountExisting(keypair.publicAddress)).toBe(true);
		expect(data.balances[0].balance).toBe(10000);
	}, 30000);

	test("Test getAccountData", async () => {
		expect(await client.isAccountExisting(keypair.publicAddress)).toBe(true);
		const data = await client.getAccountData(keypair.publicAddress);
		expect(data.balances[0].balance).toBe(10000);
		expect(data.balances.length).toBe(1);
		expect(data.balances[0].assetType).toBe('native');
		expect(data.signers.length).toBe(1);
		expect(data.signers[0].publicKey).toBe(keypair.publicAddress);
		expect(data.id).toBe(keypair.publicAddress);

		const thirdKeypair = KeyPair.generate();
		const builder = await account.buildCreateAccount({
			address: thirdKeypair.publicAddress,
			fee: 100,
			startingBalance: 1000,
			memoText: 'my first wallet'
		});

		await account.submitTransaction(builder);
		const data2 = await client.getAccountData(keypair.publicAddress);
		expect(data2.sequenceNumber).toBe(data.sequenceNumber + 1);
	}, 30000);

	test("Test getMinimumFee", async () => {
		const thirdKeypair = KeyPair.generate();
		const builder = await account.buildCreateAccount({
			address: thirdKeypair.publicAddress,
			fee: 100,
			startingBalance: 1000,
			memoText: 'my first wallet'
		});

		await account.submitTransaction(builder);
		expect(await client.isAccountExisting(thirdKeypair.publicAddress)).toBe(true);
		expect(await client.getMinimumFee()).toBe(100);
	}, 30000);

	test("Test getTransactionData", async () => {
		const thirdKeypair = KeyPair.generate();
		const builder = await account.buildCreateAccount({
			address: thirdKeypair.publicAddress,
			fee: 100,
			startingBalance: 1000,
			memoText: 'my first wallet'
		});

		const transactionId = await account.submitTransaction(builder);
		const data = await client.getTransactionData(transactionId);
		expect(data.fee).toBe(100);
	}, 30000);

	test("Test get transaction history", async () => {
		const thirdKeypair = KeyPair.generate();
		await client.friendbot({address: thirdKeypair.publicAddress, amount: 1000});

		let sendBuilder: TransactionBuilder;
		for (let i = 0; i < 2; i++) {
			sendBuilder = await account.buildSendKin({
				address: thirdKeypair.publicAddress,
				amount: 10,
				fee: 100,
				memoText: 'sending kin: ' + i
			});
			await account.submitTransaction(sendBuilder);
		}

		const history = await client.getTransactionHistory({address: thirdKeypair.publicAddress});
		expect(history.length).toBe(3);
		expect(history[0].memo).toBe("1-anon-sending kin: 1");
		expect(history[1].memo).toBe("1-anon-sending kin: 0");
		expect((history[2] as any).startingBalance).toBe(1000);
	}, 30000);


	test("Test getBalance", async () => {
		const thirdKeypair = KeyPair.generate();
		await client.friendbot({address: thirdKeypair.publicAddress, amount: 1000});

		let sendBuilder: TransactionBuilder;
		for (let i = 0; i < 2; i++) {
			sendBuilder = await account.buildSendKin({
				address: thirdKeypair.publicAddress,
				amount: 10,
				fee: 100,
				memoText: 'sending kin: ' + i
			});
			await account.submitTransaction(sendBuilder);
		}

		const balance = await client.getAccountBalance(thirdKeypair.publicAddress);
		expect(balance).toBe(1020);
	}, 30000);

	test("Test createPaymentListener", async done => {
		let hash: string;
		await client.createPaymentListener({
			addresses: [account2.publicAddress], onPayment: payment => {
				expect(payment.source).toBe(keypair.publicAddress);
				expect(payment.destination).toBe(seconedKeypair.publicAddress);
				expect(payment.memo).toBe('1-anon-sending kin');
				expect(payment.amount).toBe(10);
				expect(payment.hash).toBe(hash);
				done();
			}
		});

		let sendBuilder = await account.buildSendKin({
			address: account2.publicAddress,
			amount: 10,
			fee: 100,
			memoText: 'sending kin'
		});
		hash = await account.submitTransaction(sendBuilder);
	}, 30000);

});
