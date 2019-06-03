import {KinAccount} from "../../scripts/src/kinAccount";
import {Environment} from "../../scripts/src/environment";
import {KeyPair, KinClient} from "../../scripts/src";
import {TransactionBuilder} from "../../scripts/src/blockchain/transactionBuilder";

const integEnv = new Environment({
	url: Environment.Testnet.url,
	passphrase: Environment.Testnet.passphrase,
	friendbotUrl: "https://friendbot.developers.kinecosystem.com",
	name: "test env"
});
const keypair = KeyPair.generate();
const seconedKeypair = KeyPair.generate();
let client: KinClient;
let sender: KinAccount;
let receiver: KinAccount;

describe("KinClient", async () => {
	beforeAll(async () => {
		client = new KinClient(integEnv);
		sender = client.createKinAccount({seed: keypair.seed});
		receiver = client.createKinAccount({seed: seconedKeypair.seed});
		console.log("creating first account using friendbot = " + keypair.publicAddress);
		const transactionId = await client.friendbot({address: keypair.publicAddress, amount: 10000});
		console.log("creating first account done.");
		console.log("creating second account using friendbot = " + seconedKeypair.publicAddress);
		const secondtransactionId = await client.friendbot({address: seconedKeypair.publicAddress, amount: 10000});
		console.log("creating second account done.");
		expect(transactionId).toBeDefined();
		expect(secondtransactionId).toBeDefined();
	}, 30000);

	test("Create sender with friend bot", async () => {
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
		const builder = await sender.buildCreateAccount({
			address: thirdKeypair.publicAddress,
			fee: 100,
			startingBalance: 1000,
			memoText: 'my first wallet'
		});

		await sender.submitTransaction(builder);
		const data2 = await client.getAccountData(keypair.publicAddress);
		expect(data2.sequenceNumber).toBe(data.sequenceNumber + 1);
	}, 30000);

	test("Test getMinimumFee", async () => {
		expect(await client.getMinimumFee()).toBe(100);
	}, 30000);

	test("Test getTransactionData", async () => {
		const thirdKeypair = KeyPair.generate();
		const builder = await sender.buildCreateAccount({
			address: thirdKeypair.publicAddress,
			fee: 100,
			startingBalance: 1000,
			memoText: 'my first wallet'
		});

		const transactionId = await sender.submitTransaction(builder);
		const data = await client.getTransactionData(transactionId);
		expect((data as any).destination).toBe(thirdKeypair.publicAddress);
		expect((data as any).startingBalance).toBe(1000);
		expect(data.source).toBe(sender.publicAddress);
		expect(data.memo).toBe('1-anon-my first wallet');
	}, 30000);

	test("Test get transaction history", async () => {
		const thirdKeypair = KeyPair.generate();
		await client.friendbot({address: thirdKeypair.publicAddress, amount: 1000});

		let sendBuilder: TransactionBuilder;
		for (let i = 0; i < 2; i++) {
			sendBuilder = await sender.buildSendKin({
				address: thirdKeypair.publicAddress,
				amount: 10,
				fee: 100,
				memoText: 'sending kin: ' + i
			});
			await sender.submitTransaction(sendBuilder);
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
			sendBuilder = await sender.buildSendKin({
				address: thirdKeypair.publicAddress,
				amount: 10,
				fee: 100,
				memoText: 'sending kin: ' + i
			});
			await sender.submitTransaction(sendBuilder);
		}

		const balance = await client.getAccountBalance(thirdKeypair.publicAddress);
		expect(balance).toBe(1020);
	}, 30000);

	test("Test createPaymentListener", async done => {
		let hash: string;
		await client.createPaymentListener({
			addresses: [receiver.publicAddress], onPayment: payment => {
				console.log(payment);
				expect(payment.source).toBe(keypair.publicAddress);
				expect(payment.destination).toBe(seconedKeypair.publicAddress);
				expect(payment.memo).toBe('1-anon-sending kin');
				expect(payment.amount).toBe(10);
				expect(payment.hash).toBe(hash);
				done();
			}
		});

		let sendBuilder = await sender.buildSendKin({
			address: receiver.publicAddress,
			amount: 10,
			fee: 100,
			memoText: 'sending kin'
		});
		hash = await sender.submitTransaction(sendBuilder);
		console.log("submitTransaction " + hash);
	}, 120000);
});
