import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk';
export * as contract from '@stellar/stellar-sdk/contract';
export * as rpc from '@stellar/stellar-sdk/rpc';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CC5ELPSQFQMJ75XUPJARIODNA7UIH4RS36N37BAV4SVEBEDN4PJYVL5E",
    }
};
export const Errors = {};
export class Client extends ContractClient {
    options;
    constructor(options) {
        super(new ContractSpec(["AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAAAAAAAAAAABUluZGV4AAAAAAAAAQAAAAAAAAAHRW50cmllcwAAAAABAAAAEA==",
            "AAAAAQAAAAAAAAAAAAAABUVudHJ5AAAAAAAABQAAAAAAAAADYXByAAAAAAsAAAAAAAAADWVxdWl0eV9zaGFyZXMAAAAAAAPsAAAAEwAAAAsAAAAAAAAABmVzY3JvdwAAAAAACwAAAAAAAAAJaXBmc19oYXNoAAAAAAAAEAAAAAAAAAAOdG90YWxfaW52ZXN0ZWQAAAAAAAs=",
            "AAAAAAAAAAAAAAAJc2V0X2VudHJ5AAAAAAAAAQAAAAAAAAAFZW50cnkAAAAAAAfQAAAABUVudHJ5AAAAAAAAAA==",
            "AAAAAAAAAAAAAAAJZ2V0X2VudHJ5AAAAAAAAAQAAAAAAAAAJaXBmc19oYXNoAAAAAAAAEAAAAAEAAAfQAAAABUVudHJ5AAAA",
            "AAAAAAAAAAAAAAAGaW52ZXN0AAAAAAADAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAJaXBmc19oYXNoAAAAAAAAEAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
            "AAAAAAAAAAAAAAARZGlzdHJpYnV0ZV9wYXlvdXQAAAAAAAABAAAAAAAAAAlpcGZzX2hhc2gAAAAAAAAQAAAAAA==",
            "AAAAAAAAAAAAAAASZGlzdHJpYnV0ZV9wYXlvdXRzAAAAAAAAAAAAAA=="]), options);
        this.options = options;
    }
    fromJSON = {
        set_entry: (this.txFromJSON),
        get_entry: (this.txFromJSON),
        invest: (this.txFromJSON),
        distribute_payout: (this.txFromJSON),
        distribute_payouts: (this.txFromJSON)
    };
}
