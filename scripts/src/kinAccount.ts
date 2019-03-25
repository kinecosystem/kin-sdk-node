import {KinClient} from "./kinClient";
import {AccountData, Balance} from "./blockchain/horizonModels";
import {Server, Account} from "@kinecosystem/kin-sdk";
import {AccountDataRetriever} from "./blockchain/accountDataRetriever";
import {TxSender} from "./blockchain/TxSender";
import {Address, IWhitelistPair} from "./types";
import * as config from "./config";
import {KeyPair} from "./blockchain/keyPair";
import {
	Network,
	Transaction,
	TransactionBuilder,
	Transaction as XdrTransaction,
	Keypair
} from "@kinecosystem/kin-base";
import {KinTransactionBuilder} from "./blockchain/transactionBuilder";
import {Environment} from "./environment";
import {InvalidDataError, NetworkMismatchedError} from "./errors";
import {UTF8_ENCODING} from "./config";

interface IWhitelistPairTemp {
	// The android stellar sdk spells 'envelope' as 'envelop'
	envelop: string,
	envelope?: string,
	networkId: string
}

export class KinAccount {
	private readonly keypair: KeyPair;
	private readonly txSender: TxSender;

	private _publicAddress: string = "";

	constructor(private readonly seed: string, private readonly accountDataRetriever: AccountDataRetriever, private readonly server: Server, private readonly appId: string = config.ANON_APP_ID, private readonly channelSecretKeys?: string[]) {
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

	public async buildCreateAccount(address: Address, startingBalance: number, fee: number, memoText: string = ""): Promise<Transaction> {
		return this.txSender.buildCreateAccount(address, startingBalance, fee, memoText);
	}

	async buildSendKin(address: Address, amount: number, fee: number, memoText: string): Promise<Transaction> {
		return this.txSender.buildSendKin(address, amount, fee, memoText);
	}

	async submitTx(tx: Transaction): Promise<Server.TransactionRecord> {
		return this.txSender.submitTx(tx);
	}

	whitelistTransaction(payload: string | IWhitelistPair): string {
		let txPair: IWhitelistPair | IWhitelistPairTemp;
		if (typeof payload === "string") {
			let tx = JSON.parse(payload);
			if (tx.envelop != null) {
				txPair = JSON.parse(payload) as IWhitelistPairTemp;
				txPair.envelope = txPair.envelop;
			} else {
				txPair = JSON.parse(payload) as IWhitelistPair;
			}
		} else {
			txPair = payload;
		}

		if (typeof txPair.envelope !== "string") {
			throw new InvalidDataError();
		}

		let networkId = Network.current().networkId();
		if (networkId != txPair.networkId) {
			throw new NetworkMismatchedError();
		}

		const xdrTransaction = new XdrTransaction(txPair.envelope);
		xdrTransaction.sign(Keypair.fromSecret(this.keypair.seed));
		let envelope = xdrTransaction.toEnvelope();
		let buffer = envelope.toXDR(UTF8_ENCODING);

		return buffer.toString();
	}
}
