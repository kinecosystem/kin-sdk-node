import * as KinSdk from "@kinecosystem/kin-sdk";

/**
 * The blockchain's environment
 */
export class Environment {
	public static readonly Production = new Environment({
			name: "Production",
			url: "https://horizon.kinfederation.com",
			passphrase: KinSdk.Networks.PUBLIC
		}
	);

	public static readonly Testnet = new Environment({
			name: "Test",
			url: "https://horizon-testnet.kininfrastructure.com/",
			passphrase: KinSdk.Networks.TESTNET,
			friendbotUrl: "https://friendbot-testnet.kininfrastructure.com"
		}
	);

	private readonly _name: string;
	private readonly _url: string;
	private readonly _passphrase: string;
	private readonly _friendbotUrl?: string;

	get name(): string {
		return this._name;
	}

	get url(): string {
		return this._url;
	}

	get passphrase(): string {
		return this._passphrase;
	}

	get friendbotUrl(): string | undefined {
		return this._friendbotUrl;
	}

	private constructor(params: EnvironmentParams) {
		this._url = params.url;
		this._name = params.name;
		this._passphrase = params.passphrase;
		this._friendbotUrl = params.friendbotUrl;
	}
}

export interface EnvironmentParams {
	readonly name: string;
	readonly url: string;
	readonly passphrase: string;
	readonly friendbotUrl?: string;
}
