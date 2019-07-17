import {Keypair} from "@kinecosystem/kin-sdk";
import {Address} from "../types";
import * as crypto from "crypto";

export class KeyPair {

	private _keypair: Keypair;


	public get seed(): string {
		return this._keypair.secret();
	}

	public get publicAddress(): Address {
		return this._keypair.publicKey();
	}

	private constructor(seed?: string, seedBuffer?: Buffer) {
		if (seed) {
			this._keypair = Keypair.fromSecret(seed);
		} else if (seedBuffer) {
			this._keypair = Keypair.fromRawEd25519Seed(seedBuffer);
		} else {
			this._keypair = Keypair.random();
		}
	}

	public sign(data: Buffer) {
		this._keypair.sign(data);
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
