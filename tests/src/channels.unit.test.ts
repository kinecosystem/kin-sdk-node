import {TxSender} from "../../scripts/src/blockchain/txSender";
import {KeyPair} from "../../scripts/src/blockchain/keyPair";
import {Memo, Network, Server} from "@kinecosystem/kin-sdk";
import {IBlockchainInfoRetriever} from "../../scripts/src/blockchain/blockchainInfoRetriever";
import {ChannelsPool} from "../../scripts/src/blockchain/channelsPool";
import * as nock from "nock";
import {TransactionBuilder} from "../../scripts/src/blockchain/transactionBuilder";
import {Environment} from "../../scripts/src/environment";

const fakeUrl = "http://horizon.com";
const senderSeed = "SBVYIBM6UTDHMN7RN6VVEFKABRQBW3YB7W7RYFZFTBD6YX3IDFLS7NGW";
const receiverPublic = "GBFVXO4TI53WQVBCFZG7C4ZKPFP5Y6S6M3OZMTDVATUHQS7LXRWLWF5S";
const channelSeed = 'SARSAIEBPHPR3BQWYSDSCTYZCJCY46PZXNG2TRKQZD7TRT2INDA3QM6S';
const channelPublic = 'GC22GFLNVHQNLUID5PNYAAZ74A4DXGG5CLXLOSQQB2R65KDKULK7XRYK';
const mockedBlockchainInfoRetriever: IBlockchainInfoRetriever = {
	getMinimumFee: jest.fn(),
};

describe("Channels", async () => {
	let txSender: TxSender;
	let channelsPool: ChannelsPool;
	const appId = "test";

	beforeAll(async () => {
		const keyPair = KeyPair.fromSeed(senderSeed);
		const server = new Server(fakeUrl, {allowHttp: true});
		txSender = new TxSender(keyPair, appId, server, mockedBlockchainInfoRetriever);
		channelsPool = new ChannelsPool([channelSeed]);
	});

	test("set channel to a builder, should replace channel as source tx account, and sender as source payment", async () => {
		const sequence = "6319125253062661";
		mockLoadAccountResponse(channelPublic, sequence);

		let txBuilder: TransactionBuilder | undefined;
		await channelsPool.acquireChannel(async channel => {
			txBuilder = await txSender.buildSendKin(receiverPublic, 22.123, 100, undefined, channel);
		});
		const stellarBuilder = (txBuilder as any)._transactionBuilder;
		expect(stellarBuilder.baseFee).toEqual(100);
		expect(stellarBuilder.memo).toEqual(Memo.text('1-' + appId + '-'));
		expect(stellarBuilder.source.id).toEqual(channelPublic);
		expect(stellarBuilder.source.sequence).toEqual(sequence);
		expect((txBuilder as TransactionBuilder).build().toEnvelope().toXDR('base64'))
			.toEqual("AAAAALWjFW2p4NXRA+vbgAM/4Dg7mN0S7rdKEA6j7qhqotX7AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAHMS10ZXN0LQAAAAABAAAAAQAAAABvNPfjIRmfNq0ZrKFAxlZZEBnIxl2xdn1+tmkz7K4ofAAAAAEAAAAAS1u7k0d3aFQiLk3xcyp5X9x6Xmbdlkx1BOh4S+u8bLsAAAAAAAAAAAAhwcwAAAAAAAAAAA==");

	});

	test("set channel and submit tx, should replace channel as source tx account, and sender as source payment", async () => {
		Network.use(new Network(Environment.Testnet.passphrase));
		const sequence = "6319125253062661";
		mockLoadAccountResponse(channelPublic, sequence);
		mockCreateAccountResponse();

		let txBuilder: TransactionBuilder | undefined;
		let txHash;
		await channelsPool.acquireChannel(async channel => {
			txBuilder = await txSender.buildCreateAccount(receiverPublic, 1.2345, 100, undefined, channel);
			txHash = await txSender.submitTransaction(txBuilder);
		});
	});

	function mockLoadAccountResponse(account: string, sequence: string) {
		nock(fakeUrl)
			.get(url => url.includes(account))
			.reply(200,
				{
					"id": account,
					"paging_token": "",
					"account_id": account,
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
							"public_key": account,
							"weight": 1,
							"key": account,
							"type": "ed25519_public_key"
						}
					],
					"data": {}
				}
			);
	}

	function mockCreateAccountResponse() {
		nock(fakeUrl)
			.post(url => url.includes("/transactions"), "tx=AAAAALWjFW2p4NXRA%2BvbgAM%2F4Dg7mN0S7rdKEA6j7qhqotX7AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAHMS10ZXN0LQAAAAABAAAAAQAAAABvNPfjIRmfNq0ZrKFAxlZZEBnIxl2xdn1%2Btmkz7K4ofAAAAAAAAAAAS1u7k0d3aFQiLk3xcyp5X9x6Xmbdlkx1BOh4S%2Bu8bLsAAAAAAAHiOgAAAAAAAAAC7K4ofAAAAEDJza8icb1mMJHMLnP7o3x7NoqniwrA6sAqRsl1KN5UGCo80M7ffWF1l657B%2BwjTiQQoxtZWMLjQtwWXXVEyX0CaqLV%2BwAAAECHRSazFIZ%2BueNJvqBkkWUNE%2BOylA6lHJ2yUjr63OOkjDo1BqDdWpVHuCUil36z5yZgOGi%2Bvty8rReYli%2Bp6YcE")
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
});
