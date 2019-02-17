import {KinClient} from "./kinClient";
import {AccountData, Balance} from "./blockchain/horizonModels";
import {Status} from "./status";
import {Builder} from "./blockchain/builder";

export class KinAccount {

	constructor(seed: string, client: KinClient, channelSecretKey: string, app_id: string = ANON_APP_ID) {

	}

	getPublicAddress(): string {
		return "";
	}

	getBalance(): Promise<Balance> {
		return Promise.resolve(new Balance());
	}

	getData(): Promise<AccountData> {
		return Promise.resolve(false);
	}

	getStatus(): Promise<Status> {
		return Promise.resolve(new Status());
	}

	getTransactionBuilder(fee: number): Builder {
		return new Builder();
	}

	createAccount(address: Address, startingBalance: number, fee: number, memoText: string): Promise<{}> {
		return Promise.resolve({});
	}

	sendKin(address: Address, amount: number, fee: number, memo_text: string): Promise<string> {
		return Promise.resolve("");
	}

	buildCreateAccount(address: Address, starting_balance:number, fee: number, memo_text: string): Promise<Builder> {
		return Promise.resolve(new Builder());
	}

	submitTransaction(txBuilder: Builder): string {
		return "";
	}

	whitelist_transaction(payload: string): string {
		return "";
	}

	protected top_up(address: Address): void {

	}

}