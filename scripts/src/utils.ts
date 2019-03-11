import {StrKey} from "@kinecosystem/kin-sdk";
import {InvalidAddress} from "./errors";
import {ADDRESS_LENGTH} from "./config";
import {Address} from "./types";

export namespace Utils {

	export function isValidAddress(address: Address): boolean {
		if (address.length !== ADDRESS_LENGTH) {
			return false;
		}
		return StrKey.isValidEd25519PublicKey(address);
	}

	export async function verifyValidAddressParamAsync(address: Address) {
		if (!isValidAddress(address)) {
			throw new InvalidAddress();
		}
	}

	export function verifyValidAddressParam(address: Address) {
		if (!isValidAddress(address)) {
			throw new InvalidAddress();
		}
	}
}