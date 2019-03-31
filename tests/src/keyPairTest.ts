import {KeyPair} from "../../scripts/bin/blockchain/keyPair";

describe("KeyPair.fromSeed", async () => {

	test("expect correct public address", async () => {
		const keyPair = KeyPair.fromSeed('SC5TG6STHPVA23VXD36PK4SH2BY7NF4P2GTCM3YGWXVKRVSC62ZLZUDB');
		expect(keyPair.publicAddress).toEqual('GCYNXJPENMFKQB3AW7VTA7TLLLJSHWGO2KTAQ4P7UN27IINECYQHA42B');
	});


});
describe("KeyPair.generateHDSeed", async () => {

	test("expect correct public address", async () => {
		const keyPair = KeyPair.generateHDSeed('SC5TG6STHPVA23VXD36PK4SH2BY7NF4P2GTCM3YGWXVKRVSC62ZLZUDB', 'my_salt');
		expect(keyPair.publicAddress).toEqual('GBIQKQQBUG63BNZCXWXCBYPF5YSJK3GILVW5SFENNSAOPDS6YUV4BLRV');
	});
});
