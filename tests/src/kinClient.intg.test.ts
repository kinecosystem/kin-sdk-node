import {KinAccount} from "../../scripts/src/kinAccount";
import {KeyPair, KinClient} from "../../scripts/src";
import {TransactionBuilder} from "../../scripts/src/blockchain/transactionBuilder";
import {INTEG_ENV} from "./integConfig";

const keypair = KeyPair.generate();
const seconedKeypair = KeyPair.generate();
let client: KinClient;
let sender: KinAccount;
let receiver: KinAccount;

describe("KinClient", async () => {
	beforeAll(async () => {
		client = new KinClient(INTEG_ENV);
		sender = client.createKinAccount({ seed: keypair.seed });
		receiver = client.createKinAccount({ seed: seconedKeypair.seed });
		const transactionId = await client.friendbot({ address: keypair.publicAddress, amount: 10000 });
		const secondtransactionId = await client.friendbot({ address: seconedKeypair.publicAddress, amount: 10000 });
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
		expect(data.balances[0].assetType).toBe("native");
		expect(data.signers.length).toBe(1);
		expect(data.signers[0].publicKey).toBe(keypair.publicAddress);
		expect(data.id).toBe(keypair.publicAddress);

		const getDataKeypair = KeyPair.generate();
		const builder = await sender.buildCreateAccount({
			address: getDataKeypair.publicAddress,
			fee: 100,
			startingBalance: 1000,
			memoText: "my first wallet"
		});

		await sender.submitTransaction(builder);
		const data2 = await client.getAccountData(keypair.publicAddress);
		expect(data2.sequenceNumber).toBe(data.sequenceNumber + 1);
	}, 30000);

	test("Test getMinimumFee", async () => {
		expect(await client.getMinimumFee()).toBe(100);
	}, 60000);

	test("Test getTransactionData", async () => {
		const getTxKeypair = KeyPair.generate();
		const builder = await sender.buildCreateAccount({
			address: getTxKeypair.publicAddress,
			fee: 100,
			startingBalance: 1000,
			memoText: "my first wallet"
		});

		const transactionId = await sender.submitTransaction(builder);
		const data = await client.getTransactionData(transactionId);
		expect((data as any).destination).toBe(getTxKeypair.publicAddress);
		expect((data as any).startingBalance).toBe(1000);
		expect(data.source).toBe(sender.publicAddress);
		expect(data.memo).toBe("1-anon-my first wallet");
	}, 30000);

	test("Test get transaction history", async () => {
		const historyKeypair = KeyPair.generate();
		await client.friendbot({ address: historyKeypair.publicAddress, amount: 1000 });

		let sendBuilder: TransactionBuilder;
		for (let i = 0; i < 2; i++) {
			sendBuilder = await sender.buildSendKin({
				address: historyKeypair.publicAddress,
				amount: 10,
				fee: 100,
				memoText: "sending kin: " + i
			});
			await sender.submitTransaction(sendBuilder);
		}

		const history = await client.getTransactionHistory({ address: historyKeypair.publicAddress });
		expect(history.length).toBe(3);
		expect(history[0].memo).toBe("1-anon-sending kin: 1");
		expect(history[1].memo).toBe("1-anon-sending kin: 0");
		expect((history[2] as any).startingBalance).toBe(1000);
	}, 60000);

	test("Test getBalance", async () => {
		const balanceKeypair = KeyPair.generate();
		await client.friendbot({ address: balanceKeypair.publicAddress, amount: 1000 });

		let sendBuilder: TransactionBuilder;
		for (let i = 0; i < 2; i++) {
			sendBuilder = await sender.buildSendKin({
				address: balanceKeypair.publicAddress,
				amount: 10,
				fee: 100,
				memoText: "sending kin: " + i
			});
			await sender.submitTransaction(sendBuilder);
		}

		const balance = await client.getAccountBalance(balanceKeypair.publicAddress);
		expect(balance).toBe(1020);
	}, 60000);

	test("Test createPaymentListener", async done => {
		let hash: string;
		await client.createPaymentListener({
			addresses: [receiver.publicAddress], onPayment: payment => {
				expect(payment.source).toBe(keypair.publicAddress);
				expect(payment.destination).toBe(seconedKeypair.publicAddress);
				expect(payment.memo).toBe("1-anon-sending kin");
				expect(payment.amount).toBe(10);
				expect(payment.hash).toBe(hash);
				done();
			}
		});
		const sendBuilder = await sender.buildSendKin({
			address: receiver.publicAddress,
			amount: 10,
			fee: 100,
			memoText: "sending kin"
		});
		hash = await sender.submitTransaction(sendBuilder);
	}, 180000);
});
