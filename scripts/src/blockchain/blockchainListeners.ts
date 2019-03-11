import {Server} from "@kinecosystem/kin-sdk";
import {Address} from "../types";
import {OnPaymentListener, PaymentListener, PaymentTransaction} from "./horizonModels";
import {TransactionRetriever} from "./transactionRetriever";
import {Utils} from "../utils";

export class BlockchainListener {

	constructor(private readonly server: Server) {
		this.server = server;
	}

	createPaymentsListener(onPayment: OnPaymentListener, ...addresses: Address[]): PaymentListener {
		return new MultiAccountsListener(this.server, onPayment, addresses);
	}
}

class MultiAccountsListener implements PaymentListener {

	private readonly addresses: Set<Address> = new Set<Address>();
	private readonly stream: any;

	constructor(server: Server, private readonly onPayment: OnPaymentListener, addresses: Address[]) {
		if (addresses) {
			for (const address of addresses) {
				Utils.verifyValidAddressParam(address);
				this.addresses.add(address);
			}
		}
		this.stream = server.transactions().cursor('now').stream({
			onmessage: (txRecord: Server.TransactionRecord) => {
				let payment = TransactionRetriever.fromStellarTransaction(txRecord) as PaymentTransaction;
				if (payment.amount && payment.destination &&
					(this.addresses.has(payment.source) || this.addresses.has(payment.destination))) {
					onPayment(payment);
				}
			}
		});
	}

	addAddress(address: Address) {
		Utils.verifyValidAddressParam(address);
		this.addresses.add(address);
	}

	close() {
		this.stream.close();
	}
}
