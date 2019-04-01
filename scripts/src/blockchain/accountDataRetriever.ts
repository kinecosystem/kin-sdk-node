import {Horizon, Server, AssetType} from "@kinecosystem/kin-sdk";
import {AccountData, Balance} from "./horizonModels";
import {AccountNotFoundError, KinSdkError, NetworkError, ServerError} from "../errors"
import {Utils} from "../utils";
import {Address} from "../types";
import BalanceLineAsset = Horizon.BalanceLineAsset;
import BalanceLine = Horizon.BalanceLine;

export interface IAccountDataRetriever {
	fetchAccountData(address: Address): Promise<AccountData>;

	fetchKinBalance(address: Address): Promise<Balance>;

	isAccountExisting(address: Address): Promise<boolean>
}

export class AccountDataRetriever implements IAccountDataRetriever {

	constructor(private readonly _server: Server) {
		this._server = _server;
	}

	public async fetchAccountData(address: Address): Promise<AccountData> {
		await Utils.verifyValidAddressParamAsync(address);
		try {
			const accountResponse = await this._server.loadAccount(address);

			return {
				id: accountResponse.id,
				accountId: accountResponse.account_id,
				sequenceNumber: parseInt(accountResponse.sequenceNumber()),
				pagingToken: accountResponse.paging_token,
				subentryCount: accountResponse.subentry_count,
				thresholds: {
					highThreshold: accountResponse.thresholds.high_threshold,
					medThreshold: accountResponse.thresholds.med_threshold,
					lowThreshold: accountResponse.thresholds.low_threshold
				},
				signers: this.extractSigners(accountResponse),
				data: accountResponse.data_attr,
				balances: this.extractBalances(accountResponse),
				flags: {
					authRequired: accountResponse.flags.auth_required,
					authRevocable: accountResponse.flags.auth_revocable
				}
			}
		} catch (e) {
			if (e.response) {
				if (e.response.status === 404) {
					throw new AccountNotFoundError(address);
				} else {
					throw new ServerError(e.response.status, e.response);
				}
			} else {
				throw new NetworkError(e.message);
			}
		}
	}

	public async fetchKinBalance(address: string): Promise<Balance> {
		let balance = 0;
		const accountData = await this.fetchAccountData(address);
		for (let accountBalance of accountData.balances) {
			if (accountBalance.assetType === "native") {
				balance = accountBalance.balance;
				break;
			}
		}
		return balance;
	}

	public async isAccountExisting(address: string): Promise<boolean> {
		try {
			await this.fetchAccountData(address);
			return true;
		} catch (e) {
			if ((e as KinSdkError).type === 'AccountNotFoundError') {
				return false;
			} else {
				throw e;
			}
		}
	}

	private extractSigners(accountResponse: Server.AccountResponse) {
		const signers = new Array<AccountData.Signer>();
		for (let account of accountResponse.signers) {
			signers.push({
				publicKey: account.public_key,
				weight: account.weight
			})
		}
		return signers;
	}

	private extractBalances(accountResponse: Server.AccountResponse) {
		const balances = new Array<AccountData.Balance>();
		for (let stellarBalance of accountResponse.balances) {
			let assetCode: string | undefined = undefined;
			let assetIssuer: string | undefined = undefined;
			let limit: number | undefined = undefined;
			if (this.isBalanceLineAsset(stellarBalance)) {
				assetCode = stellarBalance.asset_code;
				assetIssuer = stellarBalance.asset_issuer;
				limit = parseFloat(stellarBalance.limit);
			}
			balances.push({
				assetType: stellarBalance.asset_type,
				balance: parseFloat(stellarBalance.balance),
				assetCode: assetCode,
				assetIssuer: assetIssuer,
				limit: limit
			});
		}
		return balances;
	}

	private isBalanceLineAsset(balanceLine: BalanceLine): balanceLine is BalanceLineAsset<AssetType.credit4> {
		return (<BalanceLineAsset>balanceLine).asset_issuer !== undefined;
	}
}
