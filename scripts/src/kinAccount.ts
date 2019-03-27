import {AccountData, Balance} from "./blockchain/horizonModels";
import {Server} from "@kinecosystem/kin-sdk";
import {AccountDataRetriever} from "./blockchain/accountDataRetriever";
import {TxSender} from "./blockchain/TxSender";
import {Address, IWhitelistPair} from "./types";
import * as config from "./config";
import {KeyPair} from "./blockchain/keyPair";
import {TransactionBuilder} from "./blockchain/transactionBuilder";

export class KinAccount {
	private readonly _keypair: KeyPair;
	private readonly _txSender: TxSender;

	private _publicAddress: string = "";

	constructor(private readonly _seed: string, private readonly _accountDataRetriever: AccountDataRetriever, private readonly _server: Server, private readonly _appId: string = config.ANON_APP_ID, private readonly _channelSecretKeys?: string[]) {
		if (!config.APP_ID_REGEX.test(_appId)) {
			throw new Error("Invalid app id: " + _appId);
		}

		this._keypair = KeyPair.fromSeed(_seed);

		if (!this._accountDataRetriever.isAccountExisting(this._keypair.publicAddress)) {
			throw new Error("Account not found: " + this._keypair.publicAddress);
		}

		this._publicAddress = this._keypair.publicAddress;
		this._txSender = new TxSender(this._keypair, this._appId, this._server);
	}

	publicAddress(): Address {
		return this._keypair.publicAddress;
	}

	async getBalance(): Promise<Balance> {

		return Promise.resolve(this._accountDataRetriever.fetchKinBalance(this.publicAddress()));
	}

	async getData(): Promise<AccountData> {
		return Promise.resolve(this._accountDataRetriever.fetchAccountData(this.publicAddress()));
	}

	getAppId(): string {
		return this._appId;
	}

	public async getTransactionBuilder(fee: number ): Promise<TransactionBuilder> {
		return await this._txSender.getTransactionBuilder(fee);
	}

	public async buildCreateAccount(address: Address, startingBalance: number, fee: number, memoText: string = ""): Promise<TransactionBuilder> {
		return await this._txSender.buildCreateAccount(address, startingBalance, fee, memoText);
	}

	async buildSendKin(address: Address, amount: number, fee: number, memoText: string): Promise<TransactionBuilder> {
		return await this._txSender.buildSendKin(address, amount, fee, memoText);
	}

	async submitTransaction(transactionBuilder: TransactionBuilder): Promise<Server.TransactionRecord> {
		return await this._txSender.submitTransaction(transactionBuilder);
	}

	whitelistTransaction(payload: string | IWhitelistPair): string {
		return this._txSender.whitelistTransaction(payload);
	}
}
