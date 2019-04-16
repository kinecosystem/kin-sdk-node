import {Account, TransactionBuilder as BaseTransactionBuilder, xdr,} from "@kinecosystem/kin-base";
import {Channel} from "./channelsPool";
import {Server} from "@kinecosystem/kin-sdk";


export class TransactionBuilder {

	private readonly _transactionBuilder: BaseTransactionBuilder;
	private readonly _channel?: Channel;

	constructor(readonly _server: Server, sourceAccount: Account, options?: BaseTransactionBuilder.TransactionBuilderOptions, channel?: Channel) {
		this._transactionBuilder = new BaseTransactionBuilder(sourceAccount, options);
		this._channel = channel;
	}

	public addFee(fee: number): this {
		if (fee >= 0) {
			(this as any)._transactionBuilder.baseFee = fee;
		}
		return this;
	}

	public setTimeout(timeout: number) {
		this._transactionBuilder.setTimeout(timeout);
		return this;
	}

	public addMemo(memo: string): this {
		(this as any).memo = memo;
		return this;
	}

	public addOperation(operation: xdr.Operation): this {
		this._transactionBuilder.addOperation(operation);
		return this;
	}

	public get channel(): Channel | undefined {
		return this._channel;
	}

	public build() {
		return this._transactionBuilder.build();
	}
}
