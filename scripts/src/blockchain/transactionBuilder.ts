import {Account, TransactionBuilder as BaseTransactionBuilder, xdr, Memo, MemoType, MemoText} from "@kinecosystem/kin-base";
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
	private readonly _appId?: string;

	constructor(readonly _server: Server, sourceAccount: Account, options: TransactionBuilderOptions, channel?: Channel) {
		this._transactionBuilder = new BaseTransactionBuilder(sourceAccount, options);
		this._appId = options.appId;
		this.addFee(options.fee);
		this.addMemo(options.memo ? options.memo : Memo.text(""));
		this._channel = channel;
	}

	public addFee(fee: number): this {
		if (typeof fee === "number" && fee >= 0) {
			(this as any)._transactionBuilder.baseFee = fee;
		} else {
			throw new TypeError('Fee must be a positive number');
		}
		return this;
	}

	public setTimeout(timeout: number) {
		this._transactionBuilder.setTimeout(timeout);
		return this;
	}

	public addMemo(memo: Memo): this {
		if (!memo) {
			throw new TypeError('Memo must be defined');
		}
		if (memo.type === MemoText){
			this._transactionBuilder.addMemo( Memo.text('1-' + this._appId + '-' + memo.value));
		} else {
			this._transactionBuilder.addMemo(memo);
		}

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
