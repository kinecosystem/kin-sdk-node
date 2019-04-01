import {Environment} from "./environment";
import {KinAccount} from "./kinAccount";
import {AccountData, Balance, OnPaymentListener, PaymentListener, Transaction} from "./blockchain/horizonModels";
import {Server} from "@kinecosystem/kin-sdk";
import {Network} from "@kinecosystem/kin-base";
import {AccountDataRetriever} from "./blockchain/accountDataRetriever";
import {Friendbot} from "./friendbot";
import {ANON_APP_ID} from "./config";
import {BlockchainInfoRetriever} from "./blockchain/blockchainInfoRetriever";
import {TransactionRetriever} from "./blockchain/transactionRetriever";
import {Address, TransactionId} from "./types";
import {BlockchainListener} from "./blockchain/blockchainListeners";

export class KinClient {

	private readonly _server: Server;
	private readonly _accountDataRetriever: AccountDataRetriever;
	private readonly _friendbotHandler: Friendbot | undefined;
	private readonly _blockchainInfoRetriever: BlockchainInfoRetriever;
	private readonly _transactionRetriever: TransactionRetriever;
	private readonly _blockchainListener: BlockchainListener;

	constructor(private readonly _environment: Environment) {
		this._environment = _environment;
		this._server = new Server(_environment.url);
		Network.use(new Network(_environment.passphrase));
		this._accountDataRetriever = new AccountDataRetriever(this._server);
		this._friendbotHandler = _environment.friendbotUrl ? new Friendbot(_environment.friendbotUrl, this._accountDataRetriever) : undefined;
		this._blockchainInfoRetriever = new BlockchainInfoRetriever(this._server);
		this._transactionRetriever = new TransactionRetriever(this._server);
		this._blockchainListener = new BlockchainListener(this._server);
	}

	get environment() {
		return this._environment
	}

	createKinAccount(seed: string, app_id: string = ANON_APP_ID, channelSecretKeys?: [string]): KinAccount {
		return new KinAccount(seed, this._accountDataRetriever, this._server, this._blockchainInfoRetriever, app_id, channelSecretKeys);
	}

	/**
	 * Get the current minimum fee that the network charges per operation.
	 * @returns The fee expressed in stroops.
	 */
	getMinimumFee(): Promise<number> {
		return this._blockchainInfoRetriever.getMinimumFee();
	}

	/**
	 * Get the current confirmed balance in kin from kin blockchain.
	 * @param address wallet address (public key)
	 */
	async getAccountBalance(address: Address): Promise<Balance> {
		return await this._accountDataRetriever.fetchKinBalance(address);
	}

	/**
	 * Check if the account exists on kin blockchain.
	 * @param address wallet address (public key)
	 */
	async isAccountExisting(address: Address): Promise<boolean> {
		return await this._accountDataRetriever.isAccountExisting(address);
	}

	/**
	 * Get detailed data on the account from kin blockchain.
	 * @param address wallet address (public key)
	 * @returns an AccountData represent account details
	 */
	async getAccountData(address: Address): Promise<AccountData | null> {
		return await this._accountDataRetriever.fetchAccountData(address);
	}

	/**
	 * Get transaction data by transaction id from kin blockchain.
	 * @param transactionId transaction id (hash)
	 */
	async getTransactionData(transactionId: TransactionId): Promise<Transaction> {
		return this._transactionRetriever.fetchTransaction(transactionId);
	}

	/**
	 * Get transaction history for a single account from kin blockchain.
	 * @param params parameters for retrieving transactions
	 */
	async getTransactionHistory(params: TransactionHistoryParams): Promise<Transaction[]> {
		return this._transactionRetriever.fetchTransactionHistory(params);
	}

	/**
	 * Creates a payment listener for the given addresses.
	 * @param onPayment payment callback listener, will be triggered when payment was happened.
	 * @param addresses addresses to listen, address can be added using PaymentListener
	 * @return PaymentListener listener object, call `close` to stop listener, `addAddress` to add additional address to listen to
	 */
	createPaymentListener(onPayment: OnPaymentListener, ...addresses: Address[]): PaymentListener {
		return this._blockchainListener.createPaymentsListener(onPayment, ...addresses);
	}

	/**
	 * Create or fund an account on playground network.
	 * If account already exists it will be funded, o.w. the account will be created with the input amount as starting
	 * balance
	 * @param address wallet address (public key) to be created/funded
	 * @param amount kin amount to fund with
	 */
	async friendbot(address: Address, amount: number): Promise<TransactionId> {
		if (!this._friendbotHandler) {
			throw Error("Friendbot url not defined, friendbot is not available on production environment");
		}
		return this._friendbotHandler.createOrFund(address, amount);
	}
}

/**
 * Parameters for getting transaction history
 */
export interface TransactionHistoryParams {

	/**
	 * Target account address for getting the history for.
	 */
	address: Address;
	/**
	 * Maximum count of transactions to retrieve.
	 */
	limit?: number;
	/**
	 * Order based on timestamp
	 */
	order?: "asc" | "desc";
	/**
	 * Optional cursor
	 */
	cursor?: string;
}
