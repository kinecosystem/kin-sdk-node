import {AccountData, Balance} from "./blockchain/horizonModels";
import {Account, Server} from "@kinecosystem/kin-sdk";
import {AccountDataRetriever} from "./blockchain/accountDataRetriever";
import {TxSender} from "./blockchain/TxSender";
import {Address} from "./types";
import * as config from "./config";
import {KeyPair} from "./blockchain/keyPair";
import {Network, Transaction, TransactionBuilder} from "@kinecosystem/kin-base";
import {KinTransactionBuilder} from "./blockchain/transactionBuilder";
import {Environment} from "./environment";

export class KinAccount {
	private keypair: KeyPair;
	private txSender: TxSender;

	private _publicAddress: string = "";

	constructor(readonly environment: Environment, private seed: string, private accountDataRetriever: AccountDataRetriever, private server: Server, private appId: string = config.ANON_APP_ID, private channelSecretKeys?: string[]) {
		if (!config.APP_ID_REGEX.test(appId)) {
			throw new Error("Invalid app id: " + appId);
		}
		// ToDo: fix the hint with real value
		this.keypair = KeyPair.fromSeed(seed);

		if (!this.accountDataRetriever.isAccountExisting(this.keypair.publicAddress)) {
			throw new Error("Account not found: " + this.keypair.publicAddress);
		}

		this._publicAddress = this.keypair.publicAddress;
		this.txSender = new TxSender(this.keypair, this.appId, this.server);
		Network.use(new Network(environment.passphrase));
		return this;
	}

	get publicAddress(): Address {
		return this.keypair.publicAddress;
	}

	async getBalance(): Promise<Balance> {

		return Promise.resolve(this.accountDataRetriever.fetchKinBalance(this.publicAddress));
	}

	async getData(): Promise<AccountData> {
		return Promise.resolve(this.accountDataRetriever.fetchAccountData(this.publicAddress));
	}

	getAppId(): string {
		return this.appId;
	}

	getTransactionBuilder(sourceAccount: Account, options?: TransactionBuilder.TransactionBuilderOptions): KinTransactionBuilder {
		return new KinTransactionBuilder(sourceAccount, options);
	}

	public async buildCreateAccount(params: CreateAccountParams): Promise<Transaction> {
		return this.txSender.createAccount(params.address, params.startingBalance, params.fee, params.memoText);
		// take care of errors!!
	}

	async buildSendKin(params: SendKinParams): Promise<Transaction> {
		return this.txSender.sendKin(params.address, params.amount, params.fee, params.memoText);
	}

	async submitTransaction(tx: Transaction): Promise<Server.TransactionRecord> {
		return this.txSender.signTx(tx);
	}

	whitelistTransaction(payload: string): string {


		return "";
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
	startingBalance: string;
	/**
	 * Fee to be deducted for the transaction.
	 */
	fee: number;

	/**
	 * Optional text to put into transaction memo, up to 21 chars.
	 */
	memoText?: string;
}

export interface SendKinParams {

	/**
	 * Target account address to create.
	 */
	address: Address;
	/**
	 * The amount in kin to send.
	 */
	amount: string;
	/**
	 * Fee to be deducted for the transaction.
	 */
	fee: number;

	/**
	 * Optional text to put into transaction memo, up to 21 chars.
	 */
	memoText?: string;
}
