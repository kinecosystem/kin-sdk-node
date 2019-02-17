import {Environment} from "./environment";
import {KinAccount} from "./kinAccount";
import {Status} from "./status";
import {AccountData, Balance} from "./blockchain/horizonModels";
import {SimplifiedTransaction, RawTransaction} from "./transaction";

export class KinClient {
	constructor(readonly environment: Environment) {
	}

	get_config(): Promise<Status> {
		return Promise.resolve(new Status());
	}

	kin_account(seed: string, channelSecretKey: string, app_id: string = ANON_APP_ID): KinAccount {
		return new KinAccount(seed, this, channelSecretKey, app_id);
	}

	getMinimumFee(): Promise<number> {
		return Promise.resolve(0);
	}

	getAccountBalance(address: Address): Promise<Balance> {
		return Promise.resolve(new Balance());
	}

	isAccountExisting(address: Address): Promise<Boolean> {
		return Promise.resolve(false);
	}

	getAccountData(address: Address): Promise<AccountData> {
		return Promise.resolve(false);
	}

	getTransactionData(tx_hash: string): Promise<SimplifiedTransaction | RawTransaction> {
		return Promise.resolve({});
	}

	friendbot(address: Address): Promise<void> {
		return Promise.resolve();
	}
}