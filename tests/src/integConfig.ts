import {Environment} from "../../scripts/src";

export const INTEG_ENV = getIntegEnv();

function getIntegEnv() {
	if (!process.env.INTEG_TESTS_NETWORK_URL ||
		!process.env.INTEG_TESTS_NETWORK_PASSPHRASE ||
		!process.env.INTEG_TESTS_NETWORK_FRIENDBOT) {
		console.error("Environment variables must be defined for running integ tests: " +
			"'INTEG_TESTS_NETWORK_URL', 'INTEG_TESTS_NETWORK_URL' , 'INTEG_TESTS_NETWORK_FRIENDBOT'. ");
		process.exit(1);
	}
	return new Environment({
		url: process.env.INTEG_TESTS_NETWORK_URL as string,
		passphrase: process.env.INTEG_TESTS_NETWORK_PASSPHRASE as string,
		friendbotUrl: process.env.INTEG_TESTS_NETWORK_FRIENDBOT,
		name: "test env"
	});
}