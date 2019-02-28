import {Environment} from "./environment";
import {KinAccount} from "./kinAccount";
import {KinClientConfig} from "./KinClientConfig";
import {AccountData, Balance} from "./blockchain/horizonModels";
import {RawTransaction, SimplifiedTransaction} from "./transaction";
import {Server} from "@kinecosystem/kin-sdk";
import {Network} from "@kinecosystem/kin-base";
import {AccountDataRetriever} from "./blockchain/accountDataRetriever";
import {Friendbot} from "./friendbot";
import {ANON_APP_ID} from "./config";
import {BlockchainInfoRetriever} from "./blockchain/blockchainInfoRetriever";

export class KinClient {

	private readonly server: Server;
	private readonly accountDataRetriever: AccountDataRetriever;
	private readonly friendbotHandler: Friendbot | undefined;
	private readonly blockchainInfoRetriever: BlockchainInfoRetriever;

	constructor(readonly environment: Environment) {
		this.environment = environment;
		this.server = new Server(environment.url);
		Network.use(new Network(environment.passphrase));
		this.accountDataRetriever = new AccountDataRetriever(this.server);
		this.friendbotHandler = environment.friendbotUrl ? new Friendbot(environment.friendbotUrl, this.accountDataRetriever) : undefined;
		this.blockchainInfoRetriever = new BlockchainInfoRetriever(this.server);
	}

	async getConfig(): Promise<KinClientConfig> {
		return new KinClientConfig();
	}

	createKinAccount(seed: string, app_id: string = ANON_APP_ID, channelSecretKeys?: [string]): KinAccount {
		return new KinAccount(seed, this, app_id, channelSecretKeys);
	}

	/**
	 * Get the current minimum fee that the network charges per operation.
	 * @returns The fee expressed in stroops.
	 */
	getMinimumFee(): Promise<number> {
		return this.blockchainInfoRetriever.getMinimumFee();
	}

	/**
	 * Get the current confirmed balance in kin from kin blockchain.
	 * @param address wallet address (public key)
	 */
	async getAccountBalance(address: Address): Promise<Balance> {
		return await this.accountDataRetriever.fetchKinBalance(address);
	}

	/**
	 * Check if the account exists on kin blockchain.
	 * @param address wallet address (public key)
	 */
	async isAccountExisting(address: Address): Promise<boolean> {
		return await this.accountDataRetriever.isAccountExisting(address);
	}

	/**
	 * Get detailed data on the account from kin blockchain.
	 * @param address wallet address (public key)
	 * @returns an AccountData represent account details
	 */
	async getAccountData(address: Address): Promise<AccountData | null> {
		return await this.accountDataRetriever.fetchAccountData(address);
	}

	async getTransactionData(txHash: string): Promise<SimplifiedTransaction | RawTransaction> {
		return Promise.resolve({});
	}

	/**
	 * Create or fund an account on playground network.
	 * If account already exists it will be funded, o.w. the account will be created with the input amount as starting
	 * balance
	 * @param address wallet address (public key) to be created/funded
	 * @param amount kin amount to fund with
	 */
	async friendbot(address: Address, amount: number): Promise<TransactionId> {
		if (!this.friendbotHandler) {
			throw Error("Friendbot url not defined, friendbot is not available on production environment");
		}
		return this.friendbotHandler.createOrFund(address, amount);
	}
}
