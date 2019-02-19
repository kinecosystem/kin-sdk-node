import * as KinSdk from "@kinecosystem/kin-sdk";

/**
 * The blockchain's environment
 */
export class Environment {
	public static readonly Production = new Environment(
		"Production",
		"https://horizon.kinfederation.com",
		KinSdk.Networks.PUBLIC
);

	public static readonly Testnet = new Environment(
		"Test",
		"https://horizon-testnet.kininfrastructure.com/",
		KinSdk.Networks.TESTNET,
		"https://friendbot-testnet.kininfrastructure.com"
	);

	private constructor(readonly name: string, readonly url: string, readonly passphrase: string, friendbotUrl?: string) {}
}
