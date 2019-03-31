import {Server} from "@kinecosystem/kin-sdk";
import {NetworkError, ServerError} from "../errors";

export interface IBlockchainInfoRetriever {
	getMinimumFee(): Promise<number>;
}

export class BlockchainInfoRetriever implements IBlockchainInfoRetriever {

	constructor(private readonly _server: Server) {
		this._server = _server;
	}

	public async getMinimumFee(): Promise<number> {
		try {
			const ledgers = await this._server.ledgers().order('desc').limit(1).call();
			return ledgers.records[0].base_fee_in_stroops;
		} catch (e) {
			if (e.response) {
				throw new ServerError(e.response.status, e.response);
			} else {
				throw new NetworkError(e.message);
			}
		}
	}
}
