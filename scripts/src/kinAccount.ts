import {AccountData, Balance} from "./blockchain/horizonModels";
import {Server} from "@kinecosystem/kin-sdk";
import {AccountDataRetriever} from "./blockchain/accountDataRetriever";
import {TxSender} from "./blockchain/txSender";
import {Address, TransactionId} from "./types";
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

	constructor(private readonly _seed: string,
				private readonly _accountDataRetriever: AccountDataRetriever, server: Server, blockchainInfoRetriever: IBlockchainInfoRetriever,
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

	public async getBalance(): Promise<Balance> {
		return await this._accountDataRetriever.fetchKinBalance(this.publicAddress);
	}

	async getData(): Promise<AccountData> {
		return await this._accountDataRetriever.fetchAccountData(this.publicAddress);
	}

	public async getTransactionBuilder(param: GetTransactionParams): Promise<TransactionBuilder> {
		return await this._txSender.getTransactionBuilder(param.fee, param.channel);
	}

	public async buildCreateAccount(params: CreateAccountParams): Promise<TransactionBuilder> {
		return await this._txSender.buildCreateAccount(params.address, params.startingBalance, params.fee, params.memoText, params.channel);
	}

	async buildSendKin(params: SendKinParams): Promise<TransactionBuilder> {
		return await this._txSender.buildSendKin(params.address, params.amount, params.fee, params.memoText, params.channel);
	}

	async submitTransaction(transactionBuilder: TransactionBuilder): Promise<TransactionId> {
		return await this._txSender.submitTransaction(transactionBuilder);
	}

	whitelistTransaction(payload: WhitelistParams): string {
		return this._txSender.whitelistTransaction(payload);
	}
}

export interface CreateAccountParams {

	/**
	 * Target account address to create.
	 */
	address: Address;
	/**
	 * The starting balance of the created account.
	 */
	startingBalance: number;
	/**
	 * Fee to be deducted for the transaction.
	 */
	fee: number;

	/**
	 * Optional text to put into transaction memo, up to 21 chars.
	 */
	memoText?: string;

	/**
	 * Optional channel to build the transaction with
	 */
	channel?: Channel;
}

export interface SendKinParams {

	/**
	 * Target account address to create.
	 */
	address: Address;
	/**
	 * The amount in kin to send.
	 */
	amount: number;
	/**
	 * Fee to be deducted for the transaction.
	 */
	fee: number;

	/**
	 * Optional text to put into transaction memo, up to 21 chars.
	 */
	memoText?: string;

	/**
	 * Optional channel to build the transaction with
	 */
	channel?: Channel;
}

export interface GetTransactionParams {

	/**
	 * Fee to be deducted for the transaction.
	 */
	fee: number;

	/**
	 * Optional channel to build the transaction with
	 */
	channel?: Channel;
}

export interface WhitelistParams {
	envelope: string;
	networkId: string;
};

export type WhitelistPayload = WhitelistParams;
