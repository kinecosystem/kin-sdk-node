import {KeyPair} from "../../scripts/src/blockchain/keyPair";
import {Channel, ChannelsPool} from "../../scripts/src/blockchain/channelsPool";
import {ChannelBusyError} from "../../scripts/src/errors";

describe("ChannelsPool", async () => {
	let channelsPool: ChannelsPool;
	const channelsSeeds = [
		'SARSAIEBPHPR3BQWYSDSCTYZCJCY46PZXNG2TRKQZD7TRT2INDA3QM6S',
		'SDBYBTXZXGXGBN6555J3ULTGPPG3VMD6V2AH7PWGPA5OZTQOEKZ43SNB',
		'SD3DGCV6AISB7WS23NLWV2ABPW5WHVSFFHC2QSQ47PLNY5MXCFLQOUFD',
		'SCICKAJ3KQ7OIN6V4IQEEPAUZEONTQQ3MUS43QQ46ROD4FR3EOI34HMG'];

	beforeAll(async () => {
		channelsPool = new ChannelsPool(channelsSeeds);
	});


	test("acquire single channel, expect correct channel state", async () => {
		let acquiredChannel: Channel | undefined;
		let isContained;
		let acquiredChannelStatus;
		await channelsPool.acquireChannel(async channel => {
			acquiredChannel = channel;
			isContained = channelsSeeds.includes(channel.keyPair.seed);
			acquiredChannelStatus = channel.state;
		});
		expect(isContained).toBe(true);
		expect(acquiredChannelStatus).toEqual('busy');
		expect((acquiredChannel as Channel).state).toEqual('free');
	});

	test("acquire single channel and throw error, acquire should throw and channel should become free", async () => {
		const error = new Error('some error');
		await expect(channelsPool.acquireChannel(async channel => {
			throw error;
		})).rejects.toEqual(error);
		expect(channelsPool.status.freeChannels).toEqual(4);
	});

	function timeoutPromise(timeoutMillis: number): Promise<void> {
		return new Promise(resolve => {
			setTimeout(() => {
				resolve();
			}, timeoutMillis);
		});
	}

	test("acquire multiple channels, expect correct channel state", async () => {
		expect(channelsPool.status.freeChannels).toEqual(4);
		expect(channelsPool.status.busyChannels).toEqual(0);
		expect(channelsPool.status.totalChannels).toEqual(4);

		let acquiredSeed1, acquiredSeed2: string | undefined;

		Promise.all([channelsPool.acquireChannel(ch1 => {
			acquiredSeed1 = ch1.keyPair.seed;
			return timeoutPromise(100);
		}),
			channelsPool.acquireChannel(ch2 => {
				acquiredSeed2 = ch2.keyPair.seed;
				return timeoutPromise(100);
			})
		]);
		expect(channelsPool.status.freeChannels).toEqual(2);
		expect(channelsPool.status.busyChannels).toEqual(2);
		expect(channelsPool.status.totalChannels).toEqual(4);
		expect(channelsPool.status.channels).toContainEqual({
			keyPair: KeyPair.fromSeed(acquiredSeed1 as unknown as string),
			state: 'busy'
		});
		expect(channelsPool.status.channels).toContainEqual({
			keyPair: KeyPair.fromSeed(acquiredSeed2 as unknown as string),
			state: 'busy'
		});
		await (timeoutPromise(110));
		expect(channelsPool.status.freeChannels).toEqual(4);
		expect(channelsPool.status.busyChannels).toEqual(0);
		expect(channelsPool.status.totalChannels).toEqual(4);

	});

	test("acquire more than available channels, should throw channel busy error", async () => {
		function acquireChannelWithBusyWaiting() {
			return channelsPool.acquireChannel(ch1 => {
				return timeoutPromise(100);
			});
		}

		Promise.all([acquireChannelWithBusyWaiting(),
			acquireChannelWithBusyWaiting(),
			acquireChannelWithBusyWaiting(),
			acquireChannelWithBusyWaiting()
		]);
		await expect(channelsPool.acquireChannel(async ch => {
		}))
			.rejects.toEqual(new ChannelBusyError());

		await (timeoutPromise(110));

		let acquireSuccess = false;
		await channelsPool.acquireChannel(async channel => {
			acquireSuccess = true;
		});
		expect(acquireSuccess).toBe(true);
	});

});
