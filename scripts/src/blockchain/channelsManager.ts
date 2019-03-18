import {KeyPair} from "./keyPair";
import {ChannelBusyError} from "../errors";
import * as crypto from "crypto";

export class ChannelsManager {

	private readonly channels: Channel[] = [];

	constructor(seeds: KeyPair[]) {
		this.channels = seeds.map(seed => ({keyPair: seed, status: 'free' as ChannelStatus}));
	}

	private getFreeChannels(): Channel[] {
		return this.channels.filter(channel => channel.status == 'free');
	}

	private async acquireChannel(func: (channel: Channel) => void): Promise<void> {
		let freeChannels = this.getFreeChannels();
		if (freeChannels.length == 0) {
			throw new ChannelBusyError();
		}
		const freeChannel = freeChannels[Math.random() * freeChannels.length];
		freeChannel.status = 'busy';
		try {
			func(freeChannel);
		} finally {
			this.releaseChannel(freeChannel);
		}
	}

	private releaseChannel(channel: Channel): void {
		channel.status = 'free';
	}
}

export class ChannelsGenerator {

	constructor() {
	}

	private generateSeeds(baseSeed: string, salt: string, channelsCount: number): KeyPair[] {
		const hashedSalt: string = crypto.createHash('sha256').update(salt).digest('hex');
		const keyPairs = [];
		for (let i = 0; i < channelsCount; i++) {
			let keyPair = KeyPair.generateHDSeed(baseSeed, hashedSalt + i);
			keyPairs.push(keyPair);
		}
		return keyPairs;
	}
}

type ChannelStatus = 'busy' | 'free';

export interface Channel {
	readonly keyPair: KeyPair;
	status: ChannelStatus;
}
