import {Address, WhitelistPayload, TransactionId} from "../types";
import {Server} from "@kinecosystem/kin-sdk";
import {Asset, Keypair, Memo, Network, Operation, Transaction as XdrTransaction} from "@kinecosystem/kin-base";
import {KeyPair} from "./keyPair";
import {TransactionBuilder} from "./transactionBuilder";
import {InvalidDataError, NetworkError, NetworkMismatchedError, ServerError} from "../errors";
import {TransactionNotFoundError} from "../../src/errors";

interface WhitelistPayloadTemp {
	// The android stellar sdk spells 'envelope' as 'envelop'
	envelop: string,
	envelope?: string,
	networkId: string
}

export class TxSender {
	constructor(private readonly _keypair: KeyPair, private readonly _appId: string, private readonly _server: Server) {
		this._keypair = _keypair;
		this._appId = _appId;
		this._server = _server;
	}

	public async getTransactionBuilder(fee: number): Promise<TransactionBuilder> {
		const response: Server.AccountResponse = await this._server.loadAccount(this._keypair.publicAddress);
		return new TransactionBuilder(response, {fee: fee}).setTimeout(0);
	}

	public async buildCreateAccount(address: Address, startingBalance: number, fee: number, memoText?: string): Promise<TransactionBuilder> {
		const response: Server.AccountResponse = await this._server.loadAccount(this._keypair.publicAddress);
		return new TransactionBuilder(response, {
			fee: fee,
			memo: memoText ? Memo.text(memoText) : Memo.none()
		})
			.setTimeout(0)
			.addOperation(Operation.createAccount({
				destination: address,
				startingBalance: startingBalance.toString()
			}));
	}

	public async buildSendKin(address: Address, amount: number, fee: number, memoText?: string): Promise<TransactionBuilder> {
		const response: Server.AccountResponse = await this._server.loadAccount(this._keypair.publicAddress);
		return new TransactionBuilder(response, {
			fee: fee,
			memo: memoText ? Memo.text(memoText) : Memo.none()
		})
			.setTimeout(0)
			.addOperation(Operation.payment({
				destination: address,
				asset: Asset.native(),
				amount: amount.toString()
			}));
	}

	public async submitTransaction(builder: TransactionBuilder): Promise<TransactionId> {
		try {
			let tx = builder.build();
			tx.sign(Keypair.fromSecret(this._keypair.seed));
			let transactionResponse = await this._server.submitTransaction(tx);
			return transactionResponse.hash;
		} catch (e) {
			if (e.response) {
				if (e.response.status === 400) {
					throw new TransactionNotFoundError(this._keypair.publicAddress);
				} else {
					throw new ServerError(e.response.status, e.response);
				}
			} else {
				throw new NetworkError(e.message);
			}
		}
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
