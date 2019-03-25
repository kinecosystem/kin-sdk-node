import {TransactionBuilder, Memo, Account} from "@kinecosystem/kin-base";

type PartialTransactionBuilder = new (sourceAccount: Account, options?: TransactionBuilder.TransactionBuilderOptions)  => { [P in Exclude<keyof TransactionBuilder, 'addMemo'>] : TransactionBuilder[P] };
const PartialTransactionBuilder = TransactionBuilder as PartialTransactionBuilder;

export class KinTransactionBuilder extends PartialTransactionBuilder {

	public addFee(fee: number): this {
		if (fee > 0 ) {
			(this as any).baseFee = fee;
		}
		return this;
	}

	public addMemo(memo: string): this {
		(this as any).memo =  memo;
		return this;
	}

	public addChannels(): this {
		return this;
	}
}
