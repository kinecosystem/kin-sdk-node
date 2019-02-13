import { Keypair } from "@kinecosystem/kin-sdk";


export {
};

const keypair = Keypair.random();
console.log(keypair.publicKey());