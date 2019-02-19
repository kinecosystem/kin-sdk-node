import {Environment} from "./environment";
import {KinAccount} from "./kinAccount";
import {KinClientConfig} from "./KinClientConfig";
import {AccountData, Balance} from "./blockchain/horizonModels";
import {SimplifiedTransaction, RawTransaction} from "./transaction";

export class KinClient {
	constructor(readonly environment: Environment) {
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
		return Promise.resolve(new Balance());
	}

	async isAccountExisting(address: Address): Promise<boolean> {
		return Promise.resolve(false);
	}

	async getAccountData(address: Address): Promise<AccountData> {
		return Promise.resolve(false);
	}

	async getTransactionData(txHash: string): Promise<SimplifiedTransaction | RawTransaction> {
		return Promise.resolve({});
	}

	// Fund account on playground
	async friendbot(address: Address): Promise<void> {
		return Promise.resolve();
	}
}
