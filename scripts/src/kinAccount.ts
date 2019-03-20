import {KinClient} from "./kinClient";
import {AccountData, Balance} from "./blockchain/horizonModels";
import {Server, Account} from "@kinecosystem/kin-sdk";
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
	constructor(readonly environment: Environment, private seed: string, private accountDataRetriever: AccountDataRetriever, private server: Server, private appId: string = config.ANON_APP_ID, private channelSecretKeys?: [string]) {
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

	publicAddress(): Address {
		return this.keypair.publicAddress;
	}

	async getBalance(): Promise<Balance> {

		return Promise.resolve(this.accountDataRetriever.fetchKinBalance(this.publicAddress()));
	}

	async getData(): Promise<AccountData> {
		return Promise.resolve(this.accountDataRetriever.fetchAccountData(this.publicAddress()));
	}

	getAppId(): string {
		return this.appId;
	}

	getTransactionBuilder(sourceAccount: Account, options?: TransactionBuilder.TransactionBuilderOptions): KinTransactionBuilder {
		return new KinTransactionBuilder(sourceAccount, options);
	}

	public async buildCreateAccount(address: Address, startingBalance: string, fee: number, memoText: string = ""): Promise<Transaction> {
		return this.txSender.createAccount(address, startingBalance, fee, memoText);
		// take care of errors!!
	}

	async buildSendKin(address: Address, amount: string, fee: number, memoText: string): Promise<Transaction> {
		return this.txSender.sendKin(address, amount, fee, memoText);
	}

	async submitTx(tx: Transaction): Promise<Server.TransactionRecord> {
		return this.txSender.signTx(tx);
	}

	whitelistTransaction(payload: string): string {


		return "";
	}
}
