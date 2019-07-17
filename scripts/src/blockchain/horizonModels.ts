import {Memo, Operation, xdr} from "@kinecosystem/kin-sdk";

export type Balance = number;
export type Address = string;
export type TransactionId = string;
export type AssetType = 'native' | 'credit_alphanum4' | 'credit_alphanum12';

export interface AccountData {
	readonly id: string;
	readonly accountId: string;
	readonly sequenceNumber: number;
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

export type Transaction = PaymentTransaction | CreateAccountTransaction | RawTransaction;

export interface TransactionBase {
	type: 'PaymentTransaction' | 'CreateAccountTransaction' | 'RawTransaction';
	fee: number;
	hash: string;
	sequence: number;
	source: string;
	timestamp: string;
	signatures: xdr.DecoratedSignature[];
}

export interface PaymentTransaction extends TransactionBase {
	type: 'PaymentTransaction';
	amount: number;
	destination: string;
	memo?: string;
}

export interface CreateAccountTransaction extends TransactionBase {
	type: 'CreateAccountTransaction';
	destination: string;
	startingBalance: number;
	memo?: string;
}

export interface RawTransaction extends TransactionBase {
	type: 'RawTransaction';
	memo?: Memo;
	operations: Operation[];
}

export interface PaymentListener {
	addAddress: (address: Address) => void;
	removeAddress: (address: Address) => void;
	close: () => void;
}

export type OnPaymentListener = (payment: PaymentTransaction) => void;
