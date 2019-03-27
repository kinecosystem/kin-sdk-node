import {
	TransactionBuilder as BaseTransactionBuilder,
	Account,
	xdr,
} from "@kinecosystem/kin-base";


export class TransactionBuilder {

	private readonly _transactionBuilder: BaseTransactionBuilder;
	constructor (sourceAccount: Account, options?: BaseTransactionBuilder.TransactionBuilderOptions) {
		this._transactionBuilder = new BaseTransactionBuilder(sourceAccount, options);
	}


	public addFee(fee: number): this {
		if (fee >= 0 ) {
			(this as any)._transactionBuilder.baseFee = fee;
		}
		return this;
	}

	public setTimeout(timeout: number) {
		this._transactionBuilder.setTimeout(timeout);
		return this;
	}

	public addMemo(memo: string): this {
		(this as any).memo =  memo;
		return this;
	}

	public addOperation(operation: xdr.Operation): this {
		this._transactionBuilder.addOperation(operation);
		return this;
	}

	public addChannels(): this {
		return this;
	}

	public build() {
		return this._transactionBuilder.build();
	}
}
