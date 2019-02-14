import { Keypair } from "@kinecosystem/kin-sdk";

describe("sample test", async () => {
	test("key pair random generation should return  a key", async () => {
	    let keypair = Keypair.random()
        expect(keypair.publicKey()).not.toBeNull()
        expect(keypair.publicKey()).not.toBeUndefined()
        expect(keypair.publicKey().length).toBe(56)
	});

});