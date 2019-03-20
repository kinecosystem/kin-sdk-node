import {Keypair} from "@kinecosystem/kin-base";
import {Address} from "../types";
import * as crypto from "crypto";

export class KeyPair {

	private keypair: Keypair;


	public get seed(): string {
		return this.keypair.secret();
	}

	public get publicAddress(): Address {
		return this.keypair.publicKey();
	}

	private constructor(seed?: string, seedBuffer?: Buffer) {
		if (seed) {
			this.keypair = Keypair.fromSecret(seed);
		} else if (seedBuffer) {
			this.keypair = Keypair.fromRawEd25519Seed(seedBuffer);
		} else {
			this.keypair = Keypair.random();
		}
	}

	public sign(data: Buffer) {
		this.keypair.sign(data);
	}

	/**
	 * Creates KeyPair from an input seed.
	 * @param seed The secret seed of an account.
	 */
	public static fromSeed(seed: string): KeyPair {
		return new KeyPair(seed, undefined);
	}

	/**
	 * Generate a new, random KeyPair.
	 */
	public static generate(): KeyPair {
		return new KeyPair(undefined, undefined);
	}

	/**
	 * Generate a highly deterministic seed from a base seed and a salt.
	 * @param baseSeed The base seed to generate a seed from.
	 * @param salt A unique string that will be used to generate the seed.
	 */
	public static generateHDSeed(baseSeed: string, salt: string): KeyPair {
		const hash = crypto.createHash('sha256').update(baseSeed + salt).digest();
		return new KeyPair(undefined, hash);
	}

	/**
	 * Gets a public address from a secret seed.
	 * @param seed The secret seed of an account.
	 */
	public static addressFromSeed(seed: string): Address {
		return Keypair.fromSecret(seed).publicKey();
	}
}
