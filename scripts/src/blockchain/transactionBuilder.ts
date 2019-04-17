import {Account, TransactionBuilder as BaseTransactionBuilder, xdr, Memo, MemoType} from "@kinecosystem/kin-base";
import {Channel} from "./channelsPool";
import {Server} from "@kinecosystem/kin-sdk";

interface TransactionBuilderOptions extends BaseTransactionBuilder.TransactionBuilderOptions {
	fee: number;
	appId: string;
	memo?: Memo<MemoType.Text>
}

export class TransactionBuilder {

	private readonly _transactionBuilder: BaseTransactionBuilder;
	private readonly _channel?: Channel;

	constructor(readonly _server: Server, sourceAccount: Account, options: TransactionBuilderOptions, channel?: Channel) {
		this._transactionBuilder = new BaseTransactionBuilder(sourceAccount, options);
		this.addFee(options.fee);
		this.addMemo(options.memo, options.appId);
		this.channel = channel;
	}

	public addFee(fee: number): this {
		if (typeof fee === "number" && fee >= 0) {
			(this as any)._transactionBuilder.baseFee = fee;
		} else {
			throw Error('Fee must be a positive number');
		}
		return this;
	}

	public setTimeout(timeout: number) {
		this._transactionBuilder.setTimeout(timeout);
		return this;
	}

	public addMemo(memo: Memo<MemoType.Text> | undefined, appId: string): this {
		(this as any)._transactionBuilder.memo = memo ? Memo.text('1-' + appId + '-' + memo.value) : Memo.none();
		return this;
	}

	public addOperation(operation: xdr.Operation): this {
		this._transactionBuilder.addOperation(operation);
		return this;
	}

	public set channel(channle: Channel | undefined) {
		(this as any)._transactionBuilder._channel = channle;
	}

	public get channel(): Channel | undefined {
		return (this as any)._transactionBuilder._channel;
	}

	public build() {
		return this._transactionBuilder.build();
	}
}
