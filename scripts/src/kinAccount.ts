import {KinClient} from "./kinClient";
import {AccountData, Balance} from "./blockchain/horizonModels";
import {KinClientConfig} from "./KinClientConfig";
import {TransactionBuilder} from "./blockchain/transactionBuilder";

export class KinAccount {
	private _publicAddress: string = "";
	constructor(seed: string, client: KinClient, app_id: string = ANON_APP_ID, channelSecretKeys?: [string]) {

	}
	get publicAddress(): string {
		return this._publicAddress;
	}

	async getBalance(): Promise<Balance> {
		return Promise.resolve(0);
	}

	async getData(): Promise<AccountData | null> {
		return Promise.resolve(null);
	}

	async getStatus(): Promise<KinClientConfig> {
		return Promise.resolve(new KinClientConfig());
	}

	getTransactionBuilder(fee: number): TransactionBuilder {
		return new TransactionBuilder();
	}

	async createAccount(address: Address, startingBalance: number, fee: number, memoText: string): Promise<string> {
		return Promise.resolve("");
	}

	async sendKin(address: Address, amount: number, fee: number, memoText: string): Promise<string> {
		return Promise.resolve("");
	}

	getCreateAccountBuilder(address: Address, startingBalance:number, fee: number, memoText: string): TransactionBuilder {
		return Promise.resolve(new TransactionBuilder());
	}

	submitTransaction(txBuilder: TransactionBuilder): string {
		return "";
	}

	whitelistTransaction(payload: string): string {
		return "";
	}

	protected topUp(address: Address): void {

	}

}
