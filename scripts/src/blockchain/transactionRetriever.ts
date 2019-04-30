import {Server} from "@kinecosystem/kin-sdk";
import {ErrorDecoder} from "../errors";
import {CreateAccountTransaction, PaymentTransaction, RawTransaction, Transaction,} from "./horizonModels";
import {Transaction as XdrTransaction} from "@kinecosystem/kin-base";
import {TransactionId} from "../types";
import {TransactionHistoryParams} from "../kinClient";

export interface ITransactionRetriever {
	fetchTransaction(transactionId: TransactionId): Promise<Transaction>;
}

export class TransactionRetriever implements ITransactionRetriever {

	private readonly DEFAULT_ORDER = 'desc';
	private readonly DEFAULT_LIMIT = 10;

	constructor(private readonly _server: Server) {
		this._server = _server;
	}

	public async fetchTransaction(transactionId: TransactionId): Promise<Transaction> {
		try {
			const transactionRecord: Server.TransactionRecord =
				await this._server.transactions().transaction(transactionId).call() as any;
			return TransactionRetriever.fromStellarTransaction(transactionRecord);
		} catch (e) {
			throw ErrorDecoder.translate(e);
		}
	}

	public async fetchTransactionHistory(params: TransactionHistoryParams): Promise<Transaction[]> {
		try {
			const transactionCallBuilder = this._server.transactions().forAccount(params.address)
				.limit(params.limit ? params.limit : this.DEFAULT_LIMIT)
				.order(params.order ? params.order : this.DEFAULT_ORDER);
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
			throw ErrorDecoder.translate(e);
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
					source: operation.source ? operation.source : transactionRecord.source_account,
					destination: operation.destination,
					amount: parseFloat(operation.amount),
					memo: transactionRecord.memo
				};
			} else if (operation.type == "createAccount") {
				return <CreateAccountTransaction>{
					...transactionBase,
					source: operation.source ? operation.source : transactionRecord.source_account,
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
