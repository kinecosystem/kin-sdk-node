import {Address} from "../types";
import {Server} from "@kinecosystem/kin-sdk";
import {Asset, Keypair, Memo, Operation, Transaction, TransactionBuilder} from "@kinecosystem/kin-base";
import {KeyPair} from "./keyPair";
import {KinTransactionBuilder} from "./transactionBuilder";
import {AccountNotFoundError, NetworkError, ServerError} from "../errors";
import {TransactionNotFoundError} from "../../src/errors";

export class TxSender {
	constructor(private readonly keypair: KeyPair, private readonly appId: string, private readonly server: Server) {
		this.keypair = keypair;
		this.appId = appId;
		this.server = server;
	}

	public async buildCreateAccount(address: Address, startingBalance: number, fee: number, memoText: string = ""): Promise<Transaction> {
		const response: Server.AccountResponse = await this.server.loadAccount(this.keypair.publicAddress);
		return new KinTransactionBuilder(response, {fee: fee, memo: Memo.text(memoText)})
					.setTimeout(0)
					.addOperation(Operation.createAccount({
						destination: address,
						startingBalance: startingBalance.toString()
					})).build();
	}

	public async buildSendKin(address: Address, amount: number, fee: number, memoText: string): Promise<Transaction> {
		const response: Server.AccountResponse = await this.server.loadAccount(this.keypair.publicAddress);
		return new KinTransactionBuilder(response, {fee: fee, memo: Memo.text(memoText)})
					.setTimeout(0)
					.addOperation(Operation.payment({
						destination: address,
						asset: Asset.native(),
						amount: amount.toString()
					})).build();
	}

	public async submitTx(tx: Transaction): Promise<Server.TransactionRecord> {
		try {
			tx.sign(Keypair.fromSecret(this.keypair.seed));
			return this.server.submitTransaction(tx);
		} catch (e) {
			if (e.response) {
				if (e.response.status === 400) {
					throw new TransactionNotFoundError(this.keypair.publicAddress);
				} else {
					throw new ServerError(e.response.status, e.response);
				}
			} else {
				throw new NetworkError(e.message);
			}
		}
	}
}
