import {Server} from "@kinecosystem/kin-sdk";

import {KinAccount} from "../../scripts/src/kinAccount";
import {AccountDataRetriever} from "../../scripts/src/blockchain/accountDataRetriever";
import {Environment} from "../../scripts/src/environment";
import {Channel, ChannelsPool, KeyPair, KinClient} from "../../scripts/src";
import {Friendbot} from "../../scripts/src/friendbot";
import {TransactionBuilder} from "../../scripts/src/blockchain/transactionBuilder";

const url = Environment.Testnet.url;
const server = new Server(url, {allowHttp: true});
const keypair = KeyPair.generate();
const seconedKeypair = KeyPair.generate();
let client: KinClient;
let friendBot: Friendbot;
let account: KinAccount;
let account2: KinAccount;

describe("KinAccount.createAccount", async () => {
	beforeAll(async () => {
		client = new KinClient(Environment.Testnet)
		friendBot = new Friendbot(url, new AccountDataRetriever(server));
		account = client.createKinAccount({seed: keypair.seed});
		account2 = client.createKinAccount({seed: seconedKeypair.seed});
		await client.friendbot({address: keypair.publicAddress, amount: 10000});
		await client.friendbot({address: seconedKeypair.publicAddress, amount: 10000});
	}, 30000);

	test("Kin Client - create account with channels", async () => {
		const thirdKeypair = KeyPair.generate();
		let channelsPool: ChannelsPool;
		const channelsSeeds = [
			'SARSAIEBPHPR3BQWYSDSCTYZCJCY46PZXNG2TRKQZD7TRT2INDA3QM6S',
			'SDBYBTXZXGXGBN6555J3ULTGPPG3VMD6V2AH7PWGPA5OZTQOEKZ43SNB',
			'SD3DGCV6AISB7WS23NLWV2ABPW5WHVSFFHC2QSQ47PLNY5MXCFLQOUFD',
			'SCICKAJ3KQ7OIN6V4IQEEPAUZEONTQQ3MUS43QQ46ROD4FR3EOI34HMG'];
		channelsPool = new ChannelsPool(channelsSeeds);
		let acquiredChannel: Channel | undefined;
		let isContained;
		let acquiredChannelStatus;
		await channelsPool.acquireChannel(async channel => {
			acquiredChannel = channel;
			isContained = channelsSeeds.includes(channel.keyPair.seed);
			acquiredChannelStatus = channel.state;
		});

		await client.createKinAccount({seed: thirdKeypair.seed, channelSecretKeys: channelsSeeds});
		await client.friendbot({address: thirdKeypair.publicAddress, amount: 1111});
		const data = await client.getAccountData(thirdKeypair.publicAddress);


		expect(await client.isAccountExisting(keypair.publicAddress)).toBe(true);
		if (data) {
			expect(data.balances[0].balance).toBe(1111);
		}

		expect(isContained).toBe(true);
		expect(acquiredChannelStatus).toEqual('busy');
		expect((acquiredChannel as Channel).state).toEqual('free');

	}, 30000);

	test("Kin Client - create account with friend bot", async () => {
		const data = await client.getAccountData(keypair.publicAddress);


		expect(await client.isAccountExisting(keypair.publicAddress)).toBe(true);
		if (data) {
			expect(data.balances[0].balance).toBe(10000);
		}

	}, 30000);

	test("Kin Client - getAccountData", async () => {
		const thirdKeypair = KeyPair.generate();
		const builder = await account.buildCreateAccount({
			address: thirdKeypair.publicAddress,
			fee: 100,
			startingBalance: 1100,
			memoText: 'my first wallet'
		});

		await account.submitTransaction(builder);
		expect(await client.isAccountExisting(thirdKeypair.publicAddress)).toBe(true);
		const data = await client.getAccountData(thirdKeypair.publicAddress);
		if (data) {
			expect(data.balances[0].balance).toBe(1100);
		}
	}, 30000);

	test("Kin Client - getMinimumFee", async () => {
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

	test("Kin Client - getTransactionData", async () => {
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

	test("Kin Client - get transaction history", async () => {
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

		const temp = await client.getTransactionHistory({address: thirdKeypair.publicAddress});
		expect(temp.length).toBe(3);
		let temp1 = await client.getAccountData(thirdKeypair.publicAddress);
		if (temp1) {
			expect(temp1.balances[0].balance).toBe(1020)
		}
	}, 30000);

	test("Kin Client - createPaymentListener", async () => {
		await client.createPaymentListener({
			addresses: [account2.publicAddress], onPayment: payment => {
				expect(payment.amount).toBe(10);
			}
		});

		let sendBuilder = await account.buildSendKin({
			address: account2.publicAddress,
			amount: 10,
			fee: 100,
			memoText: 'sending kin'
		});
		await account.submitTransaction(sendBuilder);
	}, 30000);

});
