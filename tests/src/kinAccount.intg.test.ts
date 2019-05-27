import {KinAccount} from "../../scripts/src/kinAccount";
import {Environment} from "../../scripts/src/environment";
import {Channels, KeyPair, KinClient} from "../../scripts/src";
import {Memo, Operation, Keypair, Network, Transaction as XdrTransaction} from "@kinecosystem/kin-base";
import {Server} from "@kinecosystem/kin-sdk";

const keyPair = KeyPair.generate();
const seconedKeypair = KeyPair.generate();
const thirdKeypair = KeyPair.generate();
let client: KinClient;
let account: KinAccount;
let account2: KinAccount;

describe("KinAccount", async () => {
	beforeAll(async () => {
		client = new KinClient(Environment.Testnet);
		account = client.createKinAccount({seed: keyPair.seed});
		account2 = client.createKinAccount({seed: seconedKeypair.seed});
		const transactionId = await client.friendbot({address: keyPair.publicAddress, amount: 10000});
		const secondTransactionId = await client.friendbot({address: seconedKeypair.publicAddress, amount: 10000});
		expect(transactionId).toBeDefined();
		expect(secondTransactionId).toBeDefined();

	}, 30000);

	test("Create account with channels, the receiver history must be related to the channel private key", async done => {
		await client.friendbot({address: thirdKeypair.publicAddress, amount: 10000});
		const keyPairs = await Channels.createChannels({
			environment: Environment.Testnet,
			baseSeed: thirdKeypair.seed,
			salt: "salt salt",
			channelsCount: 2,
			startingBalance: 1000
		});

		const account3 = client.createKinAccount({
			seed: thirdKeypair.seed, channelSecretKeys: keyPairs.map(keypair => {
				return keypair.seed;
			})
		});
		await account3.channelsPool!!.acquireChannel(async channel => {
			const builder = await account3.buildSendKin({
				address: seconedKeypair.publicAddress,
				amount: 200,
				fee: 100,
				memoText: "Send with channels",
				channel: channel
			});
			await account3.submitTransaction(builder);
			const history2 = await client.getRawTransactionHistory({
				address: seconedKeypair.publicAddress,
				order: "desc"
			});
			expect(history2[0].source).toBe(channel.keyPair.publicAddress);
			expect((history2[0]).operations[0].source).toBe(thirdKeypair.publicAddress);
			done();
		});

	}, 50000);

	test("Test create account", async () => {
		const localKeypair = KeyPair.generate();
		const txBuilder = await account.buildCreateAccount({
			fee: 100,
			startingBalance: 1500,
			memoText: "Test create account",
			address: localKeypair.publicAddress

		});

		await account.submitTransaction(txBuilder);
		const data = await client.isAccountExisting(localKeypair.publicAddress);
		const balance = await client.getAccountBalance(localKeypair.publicAddress);
		expect(data).toBe(true);
		expect(balance).toBe(1500);

	}, 30000);

	test("Test send kin", async () => {
		const txBuilder = await account.buildSendKin({
			fee: 100,
			amount: 150,
			memoText: "Test create account",
			address: account2.publicAddress

		});

		const balance = await client.getAccountBalance(keyPair.publicAddress);
		const secondBalance = await client.getAccountBalance(seconedKeypair.publicAddress);
		await account.submitTransaction(txBuilder);
		const balance2 = await client.getAccountBalance(keyPair.publicAddress);
		const secondBalance2 = await client.getAccountBalance(seconedKeypair.publicAddress);
		expect(balance2).toBe(balance - 150 - 0.001);
		expect(secondBalance2).toBe(secondBalance + 150);

	}, 30000);

	test("Test whitelist send kin", async () => {
		const server = new Server(Environment.Testnet.url);
		const whitelistKeypair = Keypair.fromSecret("SDH76EUIJRM4LARRAOWPBGEAWJMRXFUDCFNBEBMMIO74AWB3MZJYGJ4J");
		const whitelistAccount = client.createKinAccount({seed: "SDH76EUIJRM4LARRAOWPBGEAWJMRXFUDCFNBEBMMIO74AWB3MZJYGJ4J"});
		await client.friendbot({address: "GAJCKSF6YXOS52FIIP5MWQY2NGZLCG6RDEKYACETVRA7XV72QRHUKYBJ", amount: 250});
		const txBuilder = await whitelistAccount.buildSendKin({
			amount: 250,
			memoText: "Test create account",
			address: account2.publicAddress,
			fee: 0
		});

		const envelop = txBuilder.build().toEnvelope().toXDR("base64").toString();
		const whiteTx = await whitelistAccount.whitelistTransaction({envelope: envelop, networkId: Network.current().networkPassphrase()});

		const balance = await client.getAccountBalance(whitelistKeypair.publicKey());
		const xdrTransaction = new XdrTransaction(whiteTx);
		// A hack to submit a string as a transaction, should be use txSender.submitTransaction.
		await server.submitTransaction(xdrTransaction);
		const balance2 = await client.getAccountBalance(whitelistKeypair.publicKey());

		expect(balance2).toBe(balance - 250);

	}, 30000);

	test("Test get data and balances", async () => {
		const txBuilder = await account.buildSendKin({
			fee: 100,
			amount: 150,
			memoText: "Test get data",
			address: account2.publicAddress

		});
		await account.submitTransaction(txBuilder);
		const data = await account2.getData();
		const balance = await account2.getBalance();
		expect(data.accountId).toBe(account2.publicAddress);
		expect(data.balances[0].balance).toBe(balance);

	}, 30000);


	test("Test get transaction builder", async () => {
		const builder = await account.getTransactionBuilder({
			fee: 100
		});
		builder.setTimeout(0);
		builder.addMemo(Memo.text("Test"));
		builder.addOperation(Operation.manageData({
			name: "test", source: "", value: "new data"
		}));
		await account.submitTransaction(builder);
		const data = await account.getData();
		expect(data.data.test).toBe("bmV3IGRhdGE=");

	}, 30000);


});
