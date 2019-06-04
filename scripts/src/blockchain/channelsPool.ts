import {KeyPair} from "./keyPair";
import {ChannelBusyError} from "../errors";

export class ChannelsPool {

	private readonly channels: Channel[] = [];

	constructor(seeds: string[]) {
		this.channels = seeds.map(seed => ({keyPair: KeyPair.fromSeed(seed), state: 'free' as ChannelState}));
	}

	private getFreeChannels(): Channel[] {
		return this.channels.filter(channel => channel.state == 'free');
	}

	public async acquireChannel<T>(func: (channel: Channel) => Promise<T>): Promise<T> {
		let freeChannels = this.getFreeChannels();
		if (freeChannels.length == 0) {
			throw new ChannelBusyError();
		}
		const randomIndex = Math.floor(Math.random() * freeChannels.length);
		const freeChannel = freeChannels[randomIndex];
		freeChannel.state = 'busy';
		try {
			return await func(freeChannel);
		} finally {
			this.releaseChannel(freeChannel);
		}
	}

	public get status(): ChannelsPoolStatus {
		const freeChannels = this.getFreeChannels().length;
		return {
			totalChannels: this.channels.length,
			freeChannels: freeChannels,
			busyChannels: this.channels.length - freeChannels,
			//clone the mutable state to prevent accidentally external changes
			channels: this.channels.map(channel => ({keyPair: channel.keyPair, state: channel.state}))
		}
	}

	private releaseChannel(channel: Channel): void {
		channel.state = 'free';
	}
}

export type ChannelState = 'busy' | 'free';

export interface Channel {
	readonly keyPair: KeyPair;
	state: ChannelState;
}

export interface ChannelsPoolStatus {
	totalChannels: number,
	freeChannels: number,
	busyChannels: number,
	channels: Channel[]
}
