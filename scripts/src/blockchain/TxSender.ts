import {Address, TransactionId, WhitelistPayload} from "../types";
import {Server} from "@kinecosystem/kin-sdk";
import {Asset, Keypair, Memo, Network, Operation, Transaction as XdrTransaction} from "@kinecosystem/kin-base";
import {KeyPair} from "./keyPair";
import {TransactionBuilder} from "./transactionBuilder";
import {
	NetworkError,
	NetworkMismatchedError,
	ServerError,
	TransactionFailedError,
	TransactionNotFoundError
} from "../errors";
import {Channel} from "./channelsPool";
import {IBlockchainInfoRetriever} from "./blockchainInfoRetriever";

interface WhitelistPayloadTemp {
	// The android stellar sdk spells 'envelope' as 'envelop'
	envelop: string,
	envelope?: string,
	networkId: string
}

export class TxSender {
	private readonly CHANNEL_TOP_UP_TX_COUNT = 1000;

	constructor(private readonly _keypair: KeyPair, private readonly _appId: string, private readonly _server: Server,
				private readonly _blockchainInfoRetriever: IBlockchainInfoRetriever) {
		this._keypair = _keypair;
		this._appId = _appId;
		this._server = _server;
		this._blockchainInfoRetriever = _blockchainInfoRetriever;
	}

	public async getTransactionBuilder(fee: number, channel?: Channel): Promise<TransactionBuilder> {
		const response = await this.loadSenderAccountData(channel);
		return new TransactionBuilder(this._server, response, {fee: fee}, channel)
			.setTimeout(0);
	}

	public async buildCreateAccount(address: Address, startingBalance: number, fee: number, memoText?: string, channel?: Channel): Promise<TransactionBuilder> {
		const response = await this.loadSenderAccountData(channel);
		return new TransactionBuilder(this._server, response, {
			fee: fee,
			memo: memoText ? Memo.text(memoText) : undefined
		}, channel)
			.setTimeout(0)
			.addOperation(Operation.createAccount({
				source: this._keypair.publicAddress,
				destination: address,
				startingBalance: startingBalance.toString()
			}));
	}

	public async buildSendKin(address: Address, amount: number, fee: number, memoText?: string, channel?: Channel): Promise<TransactionBuilder> {
		const response = await this.loadSenderAccountData(channel);
		return new TransactionBuilder(this._server, response, {
			fee: fee,
			memo: memoText ? Memo.text(memoText) : undefined
		}, channel)
			.setTimeout(0)
			.addOperation(Operation.payment({
				source: this._keypair.publicAddress,
				destination: address,
				asset: Asset.native(),
				amount: amount.toString()
			}));
	}

	private async loadSenderAccountData(channel?: Channel) {
		const addressToLoad = channel ? channel.keyPair.publicAddress : this._keypair.publicAddress;
		const response: Server.AccountResponse = await this._server.loadAccount(addressToLoad);
		return response;
	}

	public async submitTransaction(builder: TransactionBuilder): Promise<TransactionId> {
		try {
			let tx = builder.build();
			const signers = new Array<Keypair>();
			signers.push(Keypair.fromSecret(this._keypair.seed));
			if (builder.channel) {
				signers.push(Keypair.fromSecret(builder.channel.keyPair.seed));
			}
			tx.sign(...signers);
			//console.debug(tx.toEnvelope().toXDR('base64'));
			let transactionResponse = await this._server.submitTransaction(tx);
			return transactionResponse.hash;
		} catch (e) {
			if (e.response) {
				if (e.response.status === 400) {
					if (this.checkForInsufficientChannelFeeBalance(builder, e)) {
						await this.topUpChannel(builder);
						// Insufficient balance is a "fast-fail", the sequence number doesn't increment
						// so there is no need to build the transaction again
						return this.submitTransaction(builder);
					}
					throw new TransactionNotFoundError(this._keypair.publicAddress);
				} else {
					throw new ServerError(e.response.status, e.response);
				}
			} else {
				throw new NetworkError(e.message);
			}
		}
	}

	private checkForInsufficientChannelFeeBalance(builder: TransactionBuilder, error: any) {
		if (!builder.channel)
			return;
		const txFailure = new TransactionFailedError(error.response.status, error.response.data);
		return txFailure.resultTransactionCode === 'tx_insufficient_balance';
	}


	private async topUpChannel(builder: TransactionBuilder) {
		const channel = builder.channel as Channel;
		const fee = await this._blockchainInfoRetriever.getMinimumFee();
		const amount = fee * this.CHANNEL_TOP_UP_TX_COUNT;
		const topUpBuilder = await this.buildSendKin(channel.keyPair.publicAddress, amount, fee);
		await this.submitTransaction(topUpBuilder);
	}

	public whitelistTransaction(payload: string | WhitelistPayload): string {
		let txPair: WhitelistPayload | WhitelistPayloadTemp;
		if (typeof payload === "string") {
			let tx = JSON.parse(payload);
			if (tx.envelop != null) {
				txPair = tx as WhitelistPayloadTemp;
				txPair.envelope = txPair.envelop;
			} else {
				txPair = tx as WhitelistPayload;
			}
		} else {
			txPair = payload;
		}

		if (typeof txPair.envelope !== "string") {
			throw new TypeError("'envelope' must be type of string");
		}

		let networkPassphrase = Network.current().networkPassphrase();
		if (networkPassphrase !== txPair.networkId) {
			throw new NetworkMismatchedError();
		}

		const xdrTransaction = new XdrTransaction(txPair.envelope);
		xdrTransaction.sign(Keypair.fromSecret(this._keypair.seed));
		let envelope = xdrTransaction.toEnvelope();
		let buffer = envelope.toXDR('base64');

		return buffer.toString();
	}
}
