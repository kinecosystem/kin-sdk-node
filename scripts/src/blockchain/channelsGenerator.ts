import {KeyPair} from "./keyPair";
import * as crypto from "crypto";
import {TxSender} from "./txSender";
import {Network, Operation} from "@kinecosystem/kin-base";
import {Environment} from "../environment";
import {Server} from "@kinecosystem/kin-sdk";
import {AccountDataRetriever, IAccountDataRetriever} from "./accountDataRetriever";
import {BlockchainInfoRetriever, IBlockchainInfoRetriever} from "./blockchainInfoRetriever";

export namespace Channels {

	export function createChannels(params: CreateChannelsParams): Promise<KeyPair[]> {
		const server = new Server(params.environment.url);
		Network.use(new Network(params.environment.passphrase));
		const accountDataRetriever = new AccountDataRetriever(server);
		const blockchainInfoRetriever = new BlockchainInfoRetriever(server);
		const txSender = new TxSender(KeyPair.fromSeed(params.baseSeed), "", server, blockchainInfoRetriever);
		return new ChannelsGenerator(txSender, accountDataRetriever, blockchainInfoRetriever)
			.createChannels(params.baseSeed, params.salt, params.channelsCount, params.startingBalance);
	}

	export function generateSeeds(params: GenerateSeedsParams): KeyPair[] {
		return ChannelsGenerator.generateSeeds(params);
	}
}

export class ChannelsGenerator {

	private static readonly CHANNELS_COUNT_LIMIT = 100;

	public static generateSeeds(params: GenerateSeedsParams): KeyPair[] {
		if (params.channelsCount > this.CHANNELS_COUNT_LIMIT) {
			/*
			 The sdk's channels are not meant to be shared across multiple instances of the script,
			 and a single instance will never even use 100 channels at once.
			 This is a limit to stop developers from needlessly creating a huge amount of channels
			 */
			throw new RangeError(`channelsCount' can be up to ${this.CHANNELS_COUNT_LIMIT}`);
		}
		const hashedSalt: string = crypto.createHash('sha256').update(params.salt).digest('hex');
		const keyPairs = [];
		for (let i = 0; i < params.channelsCount; i++) {
			let keyPair = KeyPair.generateHDSeed(params.baseSeed, hashedSalt + i);
			keyPairs.push(keyPair);
		}
		return keyPairs;
	}

	constructor(private readonly _txSender: TxSender, private readonly _accountDataRetriever: IAccountDataRetriever,
				private _blockchainInfoRetriever: IBlockchainInfoRetriever) {
		this._txSender = _txSender;
		this._blockchainInfoRetriever = _blockchainInfoRetriever;
		this._accountDataRetriever = _accountDataRetriever;
	}

	async createChannels(baseSeed: string, salt: string, channelsCount: number, startingBalance: number): Promise<KeyPair[]> {
		const channels = ChannelsGenerator.generateSeeds({
			baseSeed: baseSeed,
			salt: salt,
			channelsCount: channelsCount
		});
		const minimumFee = await this._blockchainInfoRetriever.getMinimumFee();
		const builder = await this._txSender.getTransactionBuilder(minimumFee);
		let shouldSendTx = false;
		const firstExists = await this._accountDataRetriever.isAccountExisting(channels[0].publicAddress);
		const lastExists = await this._accountDataRetriever.isAccountExisting(channels[channels.length - 1].publicAddress);
		if (firstExists && lastExists)
			return channels;

		for (const channel of channels) {
			if ((!firstExists && !lastExists) ||
				!await this._accountDataRetriever.isAccountExisting(channel.publicAddress)) {
				shouldSendTx = true;
				builder.addOperation(Operation.createAccount({
					destination: channel.publicAddress,
					startingBalance: startingBalance.toString()
				}));
			}
		}
		if (shouldSendTx) {
			await this._txSender.submitTransaction(builder);
		}
		return channels;
	}
}

export interface CreateChannelsParams {
	environment: Environment,
	baseSeed: string,
	salt: string,
	channelsCount: number,
	startingBalance: number
}

export interface GenerateSeedsParams {
	baseSeed: string,
	salt: string,
	channelsCount: number
}