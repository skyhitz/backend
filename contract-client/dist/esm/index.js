import { ContractSpec, Address } from '@stellar/stellar-sdk';
import { Buffer } from "buffer";
import { AssembledTransaction } from './assembled-tx.js';
export * from './assembled-tx.js';
export * from './method-options.js';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CBKPY5UKSG5PLW6WL7BKE5JTTUINCD5EWQWXLCD74EYNOBFIRADP4ADY",
    }
};
/**
    
    */
export const Errors = {};
export class Contract {
    options;
    spec;
    constructor(options) {
        this.options = options;
        this.spec = new ContractSpec([
            "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAQAAAAEAAAAAAAAABk9mZmVycwAAAAAAAQAAABM=",
            "AAAAAQAAAAAAAAAAAAAABU9mZmVyAAAAAAAAAwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAApsaXN0X3ByaWNlAAAAAAALAAAAAAAAAANtZnQAAAAAEw==",
            "AAAAAQAAAAAAAAAAAAAABU93bmVyAAAAAAAAAwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAANtZnQAAAAAEwAAAAAAAAAKcHVibGljX2tleQAAAAAAEw==",
            "AAAAAAAAAAAAAAADYnV5AAAAAAMAAAAAAAAABWJ1eWVyAAAAAAAAEwAAAAAAAAADbWZ0AAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
            "AAAAAAAAAAAAAAAHYmFsYW5jZQAAAAABAAAAAAAAAAdhZGRyZXNzAAAAABMAAAABAAAACw==",
            "AAAAAAAAAAAAAAAJc2V0X29mZmVyAAAAAAAAAQAAAAAAAAAFb2ZmZXIAAAAAAAfQAAAABU9mZmVyAAAAAAAAAA==",
            "AAAAAAAAAAAAAAAJZ2V0X29mZmVyAAAAAAAAAQAAAAAAAAADbWZ0AAAAABMAAAABAAAH0AAAAAVPZmZlcgAAAA==",
            "AAAAAAAAAAAAAAAMZGVsZXRlX29mZmVyAAAAAQAAAAAAAAADbWZ0AAAAABMAAAAA"
        ]);
    }
    parsers = {
        buy: () => { },
        balance: (result) => this.spec.funcResToNative("balance", result),
        setOffer: () => { },
        getOffer: (result) => this.spec.funcResToNative("get_offer", result),
        deleteOffer: () => { }
    };
    txFromJSON = (json) => {
        const { method, ...tx } = JSON.parse(json);
        return AssembledTransaction.fromJSON({
            ...this.options,
            method,
            parseResultXdr: this.parsers[method],
        }, tx);
    };
    fromJSON = {
        buy: (this.txFromJSON),
        balance: (this.txFromJSON),
        setOffer: (this.txFromJSON),
        getOffer: (this.txFromJSON),
        deleteOffer: (this.txFromJSON)
    };
    /**
* Construct and simulate a buy transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    buy = async ({ buyer, mft, amount }, options = {}) => {
        return await AssembledTransaction.fromSimulation({
            method: 'buy',
            args: this.spec.funcArgsToScVals("buy", { buyer: new Address(buyer), mft: new Address(mft), amount }),
            ...options,
            ...this.options,
            errorTypes: Errors,
            parseResultXdr: this.parsers['buy'],
        });
    };
    /**
* Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    balance = async ({ address }, options = {}) => {
        return await AssembledTransaction.fromSimulation({
            method: 'balance',
            args: this.spec.funcArgsToScVals("balance", { address: new Address(address) }),
            ...options,
            ...this.options,
            errorTypes: Errors,
            parseResultXdr: this.parsers['balance'],
        });
    };
    /**
* Construct and simulate a set_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    setOffer = async ({ offer }, options = {}) => {
        return await AssembledTransaction.fromSimulation({
            method: 'set_offer',
            args: this.spec.funcArgsToScVals("set_offer", { offer }),
            ...options,
            ...this.options,
            errorTypes: Errors,
            parseResultXdr: this.parsers['setOffer'],
        });
    };
    /**
* Construct and simulate a get_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    getOffer = async ({ mft }, options = {}) => {
        return await AssembledTransaction.fromSimulation({
            method: 'get_offer',
            args: this.spec.funcArgsToScVals("get_offer", { mft: new Address(mft) }),
            ...options,
            ...this.options,
            errorTypes: Errors,
            parseResultXdr: this.parsers['getOffer'],
        });
    };
    /**
* Construct and simulate a delete_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    deleteOffer = async ({ mft }, options = {}) => {
        return await AssembledTransaction.fromSimulation({
            method: 'delete_offer',
            args: this.spec.funcArgsToScVals("delete_offer", { mft: new Address(mft) }),
            ...options,
            ...this.options,
            errorTypes: Errors,
            parseResultXdr: this.parsers['deleteOffer'],
        });
    };
}
