import {IAccountDataRetriever} from "./blockchain/accountDataRetriever";
import axios, {AxiosResponse} from "axios";
import {FriendbotError, NetworkError} from "./errors";
import {Utils} from "./utils";
import {Address, TransactionId} from "./types";

export class Friendbot {

	constructor(private readonly url: string, private readonly accountDataRetriever: IAccountDataRetriever) {
		this.url = url;
		this.accountDataRetriever = accountDataRetriever;
	}

	public async createOrFund(address: Address, amount: number): Promise<TransactionId> {
		await Utils.verifyValidAddressParamAsync(address);
		const isAccountExisting = await this.accountDataRetriever.isAccountExisting(address);
		const requestUrl = isAccountExisting ? this.fundUrl(address, amount) : this.createAccountUrl(address, amount);

		let response: AxiosResponse<any>;
		try {
			response = await axios.get(requestUrl);
		} catch (e) {
			if (e.response) {
				response = e.response;
			} else {
				throw new NetworkError(e.message);
			}
		}

		return this.parseResponse(response);
	}

	private parseResponse(response: AxiosResponse<any>) {
		if (response.status === 200 && response.data.hash) {
			return response.data.hash;
		} else {
			throw new FriendbotError(response.status, response.data, response.data.title);
		}
	}

	private fundUrl(address: Address, amount: number) {
		return `${this.url}/fund?addr=${address}&amount=${amount}`;
	}

	private createAccountUrl(address: Address, amount: number) {
		return `${this.url}/?addr=${address}&amount=${amount}`;
	}
}
