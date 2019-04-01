import {AccountData, Balance} from "./blockchain/horizonModels";
import {Server} from "@kinecosystem/kin-sdk";
import {AccountDataRetriever} from "./blockchain/accountDataRetriever";
import {TxSender} from "./blockchain/txSender";
import {Address, TransactionId, WhitelistPayload} from "./types";
import * as config from "./config";
import {KeyPair} from "./blockchain/keyPair";
import {TransactionBuilder} from "./blockchain/transactionBuilder";
import {Channel, ChannelsPool} from "./blockchain/channelsPool";
import {IBlockchainInfoRetriever} from "./blockchain/blockchainInfoRetriever";

export class KinAccount {
	private readonly _keypair: KeyPair;
	private readonly _txSender: TxSender;
	private readonly _publicAddress: string;
	private readonly _channelsPool?: ChannelsPool;

	constructor(private readonly _seed: string, private readonly _accountDataRetriever: AccountDataRetriever,
				server: Server, blockchainInfoRetriever: IBlockchainInfoRetriever,
				private readonly _appId: string = config.ANON_APP_ID, private readonly _channelSecretKeys?: string[]) {
		if (!config.APP_ID_REGEX.test(_appId)) {
			throw new Error("Invalid app id: " + _appId);
		}
		if (_channelSecretKeys) {
			this._channelsPool = new ChannelsPool(_channelSecretKeys);
		}
		this._keypair = KeyPair.fromSeed(_seed);
		this._publicAddress = this._keypair.publicAddress;
		this._txSender = new TxSender(this._keypair, this._appId, server, blockchainInfoRetriever);
	}

	get publicAddress(): Address {
		return this._keypair.publicAddress;
	}

	get appId(): string {
		return this._appId;
	}

	get channelsPool(): ChannelsPool | undefined {
		return this._channelsPool;
	}

	async getBalance(): Promise<Balance> {
		return await this._accountDataRetriever.fetchKinBalance(this.publicAddress);
	}

	async getData(): Promise<AccountData> {
		return await this._accountDataRetriever.fetchAccountData(this.publicAddress);
	}

	public async getTransactionBuilder(fee: number, channel?: Channel): Promise<TransactionBuilder> {
		return await this._txSender.getTransactionBuilder(fee, channel);
	}

	public async buildCreateAccount(address: Address, startingBalance: number, fee: number, memoText: string = "", channel?: Channel): Promise<TransactionBuilder> {
		return await this._txSender.buildCreateAccount(address, startingBalance, fee, memoText, channel);
	}

	async buildSendKin(address: Address, amount: number, fee: number, memoText: string, channel?: Channel): Promise<TransactionBuilder> {
		return await this._txSender.buildSendKin(address, amount, fee, memoText, channel);
	}

	async submitTransaction(transactionBuilder: TransactionBuilder): Promise<TransactionId> {
		return await this._txSender.submitTransaction(transactionBuilder);
	}

	whitelistTransaction(payload: string | WhitelistPayload): string {
		return this._txSender.whitelistTransaction(payload);
	}
}
