import {ChannelsGenerator} from "../../scripts/src/blockchain/channelsGenerator";
import {KeyPair} from "../../scripts/src/blockchain/keyPair";
import {IAccountDataRetriever} from "../../scripts/src/blockchain/accountDataRetriever";
import {IBlockchainInfoRetriever} from "../../scripts/src/blockchain/blockchainInfoRetriever";
import {TxSender} from "../../scripts/src/blockchain/txSender";
import {Server} from "@kinecosystem/kin-sdk";
import {Network} from "@kinecosystem/kin-base";
import {Environment} from "../../scripts/src/environment";
import * as nock from "nock";

const fakeUrl = "http://horizon.com";
const baseSeed = "SBVYIBM6UTDHMN7RN6VVEFKABRQBW3YB7W7RYFZFTBD6YX3IDFLS7NGW";
const salt = 'salty salt';
const senderPublic = "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65";

describe("ChannelsGenerator.createChannels", async () => {
	let channelsGenerator: ChannelsGenerator;
	let mockedAccountDataRetriever: IAccountDataRetriever;
	let mockedBlockchainInfoRetriever: IBlockchainInfoRetriever;
	const expectedChannels = ['GCXJ6DA2SLT5B6OAZ5JXAVOLRO2ART6UES7P4HQC34UVW4L3URCZX5IE',
		'GAKSR7ZSIRVHQTHVUMTU2KCSSRUDM3FXEQU4IYSVGRZ5Z7PEHVHRP7MT',
		'GCZEP7D5ANTNVVWN74FHNRZ33G7AUH5LVM34APYDC6QWR2TYY26VWCYY',
		'GB3NGEFQGKJS2T36IR5P4Z47OZT2YGA43F2XEZCXZYQ3OYWQS3FDVH26',
		'GAUSN4LPU2LWS5TN4MMDNIXSE432WMX3WTG26PZ5UIC42IXCSMXIZBRR',
		'GC6JFTTU45D3U7X4MUSRQDZMBOVNCDQ4H3AVS2MOOYERPNFAFWJR7S5S',
		'GAANHFE4EHJGDWJVCBHJ5VU4MPPVBIGKYDQX4APES7VVKGOBFFD6DYVH',
		'GDJI52YYFXOE4MT36DCK4ANVWA2CMOW2TQJYGVUOI62C2A6AP2EFZL3P',
		'GDTYPEKLD6DXS625RTWJLYYQBYEPSJ2CZ3MS4JX5POXDNE5I7ZIQPU6G',
		'GCRAXM5JCDXT2RO7OK2NFMBZ7SI2SMPACYBPOLTM7FCJFGJYJ37VZWBR',
		'GDJ7352OGIUPUMFIA5UZWTBNTFCCQKHYWN4IRT2UWEEYVQ5FG3QITLL2'];

	beforeEach(async () => {
		mockedAccountDataRetriever = {
			fetchAccountData: jest.fn(),
			fetchKinBalance: jest.fn(),
			isAccountExisting: jest.fn()
		};

		mockedBlockchainInfoRetriever = {
			getMinimumFee: jest.fn(),
		};

		Network.use(new Network(Environment.Testnet.passphrase));
		const server = new Server(fakeUrl, {allowHttp: true});
		const txSender = new TxSender(KeyPair.fromSeed(baseSeed),
			"", server, mockedBlockchainInfoRetriever);
		channelsGenerator = new ChannelsGenerator(txSender, mockedAccountDataRetriever, mockedBlockchainInfoRetriever);
	});

	test("create channels, expect correct transaction sent to blockchain and correct channels returned", async () => {
		(mockedBlockchainInfoRetriever.getMinimumFee as jest.Mock).mockResolvedValue(100);
		(mockedAccountDataRetriever.isAccountExisting as jest.Mock).mockResolvedValue(false);
		mockLoadAccountResponse("12345678");
		//the expected tx envelope that will be sent to the network, consists "create account" operation for each of the
		//'expectedChannels' channel address, fee will should be the minimum fee returned from getMinimumFee * channels count
		const sendKinCall = mockSendKinResponse('AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAETAAAAAAAvGFPAAAAAAAAAAEAAAADMS0tAAAAAAsAAAAAAAAAAAAAAACunwwakufQ%2BcDPU3BVy4u0CM%2FUJL7%2BHgLfKVtxe6RFmwAAAAAAIi4AAAAAAAAAAAAAAAAAFSj%2FMkRqeEz1oydNKFKUaDZstyQpxGJVNHPc%2FeQ9TxcAAAAAACIuAAAAAAAAAAAAAAAAALJH%2FH0DZtrWzf8Kdsc72b4KH6urN8A%2FAxehaOp4xr1bAAAAAAAiLgAAAAAAAAAAAAAAAAB20xCwMpMtT35Eev5nn3ZnrBgc2XVyZFfOIbdi0JbKOgAAAAAAIi4AAAAAAAAAAAAAAAAAKSbxb6aXaXZt4xg2ovInN6sy%2B7TNrz89ogXNIuKTLowAAAAAACIuAAAAAAAAAAAAAAAAALySznTnR7p%2B%2FGUlGA8sC6rRDhw%2BwVlpjnYJF7SgLZMfAAAAAAAiLgAAAAAAAAAAAAAAAAAA05ScIdJh2TUQTp7WnGPfUKDKwOF%2BAeSX61UZwSlH4QAAAAAAIi4AAAAAAAAAAAAAAAAA0o7rGC3cTjJ78MSuAbWwNCY62pwTg1aOR7QtA8B%2BiFwAAAAAACIuAAAAAAAAAAAAAAAAAOeHkUsfh3l7XYzsleMQDgj5J0LO2S4m%2FXuuNpOo%2FlEHAAAAAAAiLgAAAAAAAAAAAAAAAACiC7OpEO89Rd9ytNKwOfyRqTHgFgL3Lmz5RJKZOE7%2FXAAAAAAAIi4AAAAAAAAAAAAAAAAA0%2F33TjIo%2BjCoB2mbTC2ZRCgo%2BLN4iM9UsQmKw6U24IkAAAAAACIuAAAAAAAAAAAB7K4ofAAAAEDhhXwTNw9spCXqeRaeJ8RellZ71HNdSkc6IO%2FWDrESgqSgqjNKuSokZ%2B7fYnIizBRhExvWBN4zX9m%2BUtumIAsG');

		const channels = await channelsGenerator.createChannels(baseSeed, salt, 11, 22.4);
		expect(channels.map(keyPair => keyPair.publicAddress)).toEqual(expectedChannels);
		expect(sendKinCall.isDone()).toEqual(true);
		//should check existence for the first and last accounts only and skip the rest
		expect(mockedAccountDataRetriever.isAccountExisting).toBeCalledTimes(2);
	});

	test("create channels when only first exists, expect no transaction sent to blockchain and correct channels returned", async () => {
		(mockedBlockchainInfoRetriever.getMinimumFee as jest.Mock).mockResolvedValue(100);
		//claim that some accounts existing
		(mockedAccountDataRetriever.isAccountExisting as jest.Mock).mockImplementation(args => {
			const address = args;
			return address === expectedChannels[0];
		});
		mockLoadAccountResponse("12345678");
		//the expected tx envelope that will be sent to the network, consists "create account" operation for each of the
		//'expectedChannels' channel address, fee will should be the minimum fee returned from getMinimumFee * channels count
		const sendKinCall = mockSendKinResponse('AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAD6AAAAAAAvGFPAAAAAAAAAAEAAAADMS0tAAAAAAoAAAAAAAAAAAAAAAAVKP8yRGp4TPWjJ00oUpRoNmy3JCnEYlU0c9z95D1PFwAAAAAAIi4AAAAAAAAAAAAAAAAAskf8fQNm2tbN%2Fwp2xzvZvgofq6s3wD8DF6Fo6njGvVsAAAAAACIuAAAAAAAAAAAAAAAAAHbTELAyky1PfkR6%2FmefdmesGBzZdXJkV84ht2LQlso6AAAAAAAiLgAAAAAAAAAAAAAAAAApJvFvppdpdm3jGDai8ic3qzL7tM2vPz2iBc0i4pMujAAAAAAAIi4AAAAAAAAAAAAAAAAAvJLOdOdHun78ZSUYDywLqtEOHD7BWWmOdgkXtKAtkx8AAAAAACIuAAAAAAAAAAAAAAAAAADTlJwh0mHZNRBOntacY99QoMrA4X4B5JfrVRnBKUfhAAAAAAAiLgAAAAAAAAAAAAAAAADSjusYLdxOMnvwxK4BtbA0JjranBODVo5HtC0DwH6IXAAAAAAAIi4AAAAAAAAAAAAAAAAA54eRSx%2BHeXtdjOyV4xAOCPknQs7ZLib9e642k6j%2BUQcAAAAAACIuAAAAAAAAAAAAAAAAAKILs6kQ7z1F33K00rA5%2FJGpMeAWAvcubPlEkpk4Tv9cAAAAAAAiLgAAAAAAAAAAAAAAAADT%2FfdOMij6MKgHaZtMLZlEKCj4s3iIz1SxCYrDpTbgiQAAAAAAIi4AAAAAAAAAAAHsrih8AAAAQNQDtAcI4zUEeVgibFdrinnT3VMmfCZsaP4wrKbsnBW5H3qnUmPzRV%2FNME%2BnHoeIkUX3bx6pvs88LGL96eI53QM%3D');

		const channels = await channelsGenerator.createChannels(baseSeed, salt, 11, 22.4);
		expect(channels.map(keyPair => keyPair.publicAddress)).toEqual(expectedChannels);
		expect(sendKinCall.isDone()).toEqual(true);
		expect(mockedAccountDataRetriever.isAccountExisting).toBeCalledTimes(2 + 11);
	});

	test("create channels when first and last accounts exists, expect no transaction sent to blockchain and correct channels returned", async () => {
		(mockedBlockchainInfoRetriever.getMinimumFee as jest.Mock).mockResolvedValue(100);
		//claim that some accounts existing
		(mockedAccountDataRetriever.isAccountExisting as jest.Mock).mockImplementation(args => {
			const address = args;
			return address === expectedChannels[0] ||
				address === expectedChannels[expectedChannels.length - 1];
		});
		mockLoadAccountResponse("12345678");
		const channels = await channelsGenerator.createChannels(baseSeed, salt, 11, 22.4);
		expect(channels.map(keyPair => keyPair.publicAddress)).toEqual(expectedChannels);
		expect(mockedAccountDataRetriever.isAccountExisting).toBeCalledTimes(2);
	});

	test("create channels when all channels already created, expect no transaction sent to blockchain and correct channels returned", async () => {
		(mockedBlockchainInfoRetriever.getMinimumFee as any).mockResolvedValue(100);
		(mockedAccountDataRetriever.isAccountExisting as any).mockResolvedValue(true);
		mockLoadAccountResponse("12345678");
		const sendKinCall = mockSendKinResponse('AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAADhAAAAAAAvGFPAAAAAAAAAAEAAAADMS0tAAAAAAkAAAAAAAAAAAAAAACunwwakufQ%2BcDPU3BVy4u0CM%2FUJL7%2BHgLfKVtxe6RFmwAAAAAAIi4AAAAAAAAAAAAAAAAAdtMQsDKTLU9%2BRHr%2BZ592Z6wYHNl1cmRXziG3YtCWyjoAAAAAACIuAAAAAAAAAAAAAAAAACkm8W%2Bml2l2beMYNqLyJzerMvu0za8%2FPaIFzSLiky6MAAAAAAAiLgAAAAAAAAAAAAAAAAC8ks5050e6fvxlJRgPLAuq0Q4cPsFZaY52CRe0oC2THwAAAAAAIi4AAAAAAAAAAAAAAAAAANOUnCHSYdk1EE6e1pxj31CgysDhfgHkl%2BtVGcEpR%2BEAAAAAACIuAAAAAAAAAAAAAAAAANKO6xgt3E4ye%2FDErgG1sDQmOtqcE4NWjke0LQPAfohcAAAAAAAiLgAAAAAAAAAAAAAAAADnh5FLH4d5e12M7JXjEA4I%2BSdCztkuJv17rjaTqP5RBwAAAAAAIi4AAAAAAAAAAAAAAAAAoguzqRDvPUXfcrTSsDn8kakx4BYC9y5s%2BUSSmThO%2F1wAAAAAACIuAAAAAAAAAAAAAAAAANP9904yKPowqAdpm0wtmUQoKPizeIjPVLEJisOlNuCJAAAAAAAiLgAAAAAAAAAAAeyuKHwAAABAsy4dapFtsgMv3BgoSTRYx6CZijKThA5Gn9XP5WH0MyuKqSXdE%2B0AaNsVST15QZqdJJt7fme6nAS2ctp7gQ%2BHCw%3D%3D');

		const channels = await channelsGenerator.createChannels(baseSeed, salt, 11, 22.4);
		expect(channels.map(keyPair => keyPair.publicAddress)).toEqual(expectedChannels);
		expect(sendKinCall.isDone()).toEqual(false);
	});

	test("create channels with more than 100 channels count", async () => {
		await expect(channelsGenerator.createChannels(baseSeed, salt, 101, 22.4))
			.rejects.toBeInstanceOf(RangeError);
	});

	function mockLoadAccountResponse(sequence: string) {
		nock(fakeUrl)
			.get(url => url.includes(senderPublic))
			.reply(200,
				{
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

	function mockSendKinResponse(txEnvelope: string) {
		return nock(fakeUrl)
			.post(url => url.includes("/transactions"), `tx=${txEnvelope}`)
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

});

describe("ChannelsGenerator.generateSeeds", async () => {

	test("generate seeds from the same random input twice, should be equal", async () => {
		const randomSalt = generateRandomString(10);
		const randomSeed = KeyPair.generate().seed;
		const keyPairs1 = ChannelsGenerator.generateSeeds({
			baseSeed: randomSeed,
			channelsCount: 6,
			salt: randomSalt
		});

		const keyPairs2 = ChannelsGenerator.generateSeeds({
			baseSeed: randomSeed,
			channelsCount: 6,
			salt: randomSalt
		});

		expect(keyPairs1.length).toEqual(6);
		expect(keyPairs1.length).toEqual(keyPairs2.length);
		expect(keyPairs1).toEqual(keyPairs2);
	});

	test("generate seeds from the same random input twice with different count, the first n channels should be equal", async () => {
		const randomSalt = generateRandomString(10);
		const randomSeed = KeyPair.generate().seed;
		const keyPairs1 = ChannelsGenerator.generateSeeds({
			baseSeed: randomSeed,
			channelsCount: 8,
			salt: randomSalt
		});

		const keyPairs2 = ChannelsGenerator.generateSeeds({
			baseSeed: randomSeed,
			channelsCount: 5,
			salt: randomSalt
		});

		expect(keyPairs1.length).toEqual(8);
		expect(keyPairs2.length).toEqual(5);
		expect(keyPairs1.slice(0, 5)).toEqual(keyPairs2);
	});
});

function generateRandomString(length: number): string {
	const ID_CHARS = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let id = "";

	while (id.length < length) {
		id += ID_CHARS[randomInteger(0, ID_CHARS.length)];
	}

	return id;
}

function randomInteger(min: number, max: number): number {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}
