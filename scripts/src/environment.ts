/**
 * The blockchain's environment
 */

import * as KinSdk from "@kinecosystem/kin-sdk";

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
	);

	private constructor(readonly name: string, readonly url: string, readonly passphrase: string) {}
}
