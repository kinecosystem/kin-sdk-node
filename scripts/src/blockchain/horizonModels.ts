export type Balance = number;

type AssetType = 'native' | 'credit_alphanum4' | 'credit_alphanum12';

export interface AccountData {
	readonly id: string;
	readonly accountId: string;
	readonly sequenceNumber: string;
	readonly pagingToken: string;
	readonly subentryCount: number;
	readonly thresholds: AccountData.Thresholds;
	readonly flags: AccountData.Flags;
	readonly balances: AccountData.Balance[];
	readonly signers: AccountData.Signer[];
	readonly data: {
		[key: string]: string
	};
}

export namespace AccountData {

	export interface Flags {
		readonly authRequired: boolean;
		readonly authRevocable: boolean;
	}

	export interface Balance {
		readonly assetType: AssetType;
		readonly assetCode?: string;
		readonly assetIssuer?: string;
		readonly balance: number;
		readonly limit?: number;
	}

	export interface Signer {
		readonly publicKey: string;
		readonly weight: number;
	}

	export interface Thresholds {
		readonly lowThreshold: number;
		readonly medThreshold: number;
		readonly highThreshold: number;
	}
}