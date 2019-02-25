import {Environment} from "./environment";
import {KinAccount} from "./kinAccount";
import {KinClientConfig} from "./KinClientConfig";
import {AccountData, Balance} from "./blockchain/horizonModels";
import {RawTransaction, SimplifiedTransaction} from "./transaction";
import {Server} from "@kinecosystem/kin-sdk";
import {Network} from "@kinecosystem/kin-base";
import {AccountDataRetriever} from "./blockchain/accountDataRetriever";

export class KinClient {

	private readonly server: Server;
	private readonly accountDataRetriever: AccountDataRetriever;

	constructor(readonly environment: Environment) {
		this.environment = environment;
		this.server = new Server(environment.url);
		Network.use(new Network(environment.passphrase));
		this.accountDataRetriever = new AccountDataRetriever(this.server);
	}

	async getConfig(): Promise<KinClientConfig> {
		return new KinClientConfig();
	}

	createKinAccount(seed: string, app_id: string = ANON_APP_ID, channelSecretKeys?: [string]): KinAccount {
		return new KinAccount(seed, this, app_id, channelSecretKeys);
	}

	getMinimumFee(): Promise<number> {
		return Promise.resolve(0);
	}

	async getAccountBalance(address: Address): Promise<Balance> {
		return await this.accountDataRetriever.fetchKinBalance(address);
	}

	async isAccountExisting(address: Address): Promise<boolean> {
		return await this.accountDataRetriever.isAccountExisting(address);
	}

	async getAccountData(address: Address): Promise<AccountData | null> {
		return await this.accountDataRetriever.fetchAccountData(address);
	}

	async getTransactionData(txHash: string): Promise<SimplifiedTransaction | RawTransaction> {
		return Promise.resolve({});
	}

	// Fund account on playground
	async friendbot(address: Address): Promise<void> {
		return Promise.resolve();
	}
}
