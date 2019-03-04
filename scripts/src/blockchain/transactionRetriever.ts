import {Server} from "@kinecosystem/kin-sdk";
import {AccountNotFoundError, NetworkError, ServerError, TransactionNotFoundError} from "../errors";
import {CreateAccountTransaction, PaymentTransaction, RawTransaction, Transaction,} from "./horizonModels";
import {Transaction as XdrTransaction} from "@kinecosystem/kin-base";
import {TransactionId} from "../types";
import {TransactionHistoryParams} from "../kinClient";

export interface ITransactionRetriever {
	fetchTransaction(transactionId: TransactionId): Promise<Transaction>;
}

export class TransactionRetriever implements ITransactionRetriever {

	constructor(private readonly server: Server) {
		this.server = server;
	}

	public async fetchTransaction(transactionId: TransactionId): Promise<Transaction> {
		try {
			const transactionRecord: Server.TransactionRecord =
				await this.server.transactions().transaction(transactionId).call() as any;
			return TransactionRetriever.fromStellarTransaction(transactionRecord);
		} catch (e) {
			if (e.response) {
				if (e.response.status === 404) {
					throw new TransactionNotFoundError(transactionId);
				} else {
					throw new ServerError(e.response.status, e.response);
				}
			} else {
				throw new NetworkError(e.message);
			}
		}
	}

	public async fetchTransactionsHistory(params: TransactionHistoryParams): Promise<Transaction[]> {
		try {
			const transactionCallBuilder = this.server.transactions().forAccount(params.address)
				.limit(params.limit ? params.limit : 10)
				.order(params.order ? params.order : 'desc');
			if (params.cursor) {
				transactionCallBuilder.cursor(params.cursor);
			}
			const transactionRecords = await transactionCallBuilder.call();
			const transactionHistory = new Array<Transaction>();
			for (let record of transactionRecords.records) {
				transactionHistory.push(TransactionRetriever.fromStellarTransaction(record));
			}
			return transactionHistory;
		} catch (e) {
			if (e.response) {
				if (e.response.status === 404) {
					throw new AccountNotFoundError(params.address);
				} else {
					throw new ServerError(e.response.status, e.response);
				}
			} else {
				throw new NetworkError(e);
			}
		}
	}

	public static fromStellarTransaction(transactionRecord: Server.TransactionRecord): Transaction {
		const xdrTransaction = new XdrTransaction(transactionRecord.envelope_xdr);
		const operations = xdrTransaction.operations;
		const transactionBase = {
			fee: xdrTransaction.fee,
			hash: transactionRecord.hash,
			sequence: parseInt(transactionRecord.source_account_sequence),
			signatures: xdrTransaction.signatures,
			source: transactionRecord.source_account
		};

		if (operations.length == 1) {
			let operation = operations[0];
			if (operation.type == "payment") {
				return <PaymentTransaction>{
					...transactionBase,
					destination: operation.destination,
					amount: parseFloat(operation.amount),
					memo: transactionRecord.memo
				};
			} else if (operation.type == "createAccount") {
				return <CreateAccountTransaction>{
					...transactionBase,
					destination: operation.destination,
					startingBalance: parseFloat(operation.startingBalance),
					memo: transactionRecord.memo
				};
			}
		}

		return <RawTransaction>{
			...transactionBase,
			memo: xdrTransaction.memo,
			operations: xdrTransaction.operations
		};
	}
}
