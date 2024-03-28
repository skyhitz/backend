import { ContractSpec, Address } from '@stellar/stellar-sdk';
import { Buffer } from "buffer";
import { AssembledTransaction, Ok, Err } from './assembled-tx.js';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
  Error_,
  Result,
} from './assembled-tx.js';
import type { ClassOptions, XDR_BASE64 } from './method-options.js';

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
} as const

/**
    
    */
export type DataKey = {tag: "Offers", values: readonly [string]};

/**
    
    */
export interface Offer {
  /**
    
    */
amount: i128;
  /**
    
    */
list_price: i128;
  /**
    
    */
mft: string;
}

/**
    
    */
export interface Owner {
  /**
    
    */
amount: i128;
  /**
    
    */
mft: string;
  /**
    
    */
public_key: string;
}

/**
    
    */
export const Errors = {

}

export class Contract {
    spec: ContractSpec;
    constructor(public readonly options: ClassOptions) {
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
    private readonly parsers = {
        buy: () => {},
        balance: (result: XDR_BASE64): i128 => this.spec.funcResToNative("balance", result),
        setOffer: () => {},
        getOffer: (result: XDR_BASE64): Offer => this.spec.funcResToNative("get_offer", result),
        deleteOffer: () => {}
    };
    private txFromJSON = <T>(json: string): AssembledTransaction<T> => {
        const { method, ...tx } = JSON.parse(json)
        return AssembledTransaction.fromJSON(
            {
                ...this.options,
                method,
                parseResultXdr: this.parsers[method],
            },
            tx,
        );
    }
    public readonly fromJSON = {
        buy: this.txFromJSON<ReturnType<typeof this.parsers['buy']>>,
        balance: this.txFromJSON<ReturnType<typeof this.parsers['balance']>>,
        setOffer: this.txFromJSON<ReturnType<typeof this.parsers['setOffer']>>,
        getOffer: this.txFromJSON<ReturnType<typeof this.parsers['getOffer']>>,
        deleteOffer: this.txFromJSON<ReturnType<typeof this.parsers['deleteOffer']>>
    }
        /**
    * Construct and simulate a buy transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
    */
    buy = async ({buyer, mft, amount}: {buyer: string, mft: string, amount: i128}, options: {
        /**
         * The fee to pay for the transaction. Default: 100.
         */
        fee?: number,
    } = {}) => {
        return await AssembledTransaction.fromSimulation({
            method: 'buy',
            args: this.spec.funcArgsToScVals("buy", {buyer: new Address(buyer), mft: new Address(mft), amount}),
            ...options,
            ...this.options,
            errorTypes: Errors,
            parseResultXdr: this.parsers['buy'],
        });
    }


        /**
    * Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
    */
    balance = async ({address}: {address: string}, options: {
        /**
         * The fee to pay for the transaction. Default: 100.
         */
        fee?: number,
    } = {}) => {
        return await AssembledTransaction.fromSimulation({
            method: 'balance',
            args: this.spec.funcArgsToScVals("balance", {address: new Address(address)}),
            ...options,
            ...this.options,
            errorTypes: Errors,
            parseResultXdr: this.parsers['balance'],
        });
    }


        /**
    * Construct and simulate a set_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
    */
    setOffer = async ({offer}: {offer: Offer}, options: {
        /**
         * The fee to pay for the transaction. Default: 100.
         */
        fee?: number,
    } = {}) => {
        return await AssembledTransaction.fromSimulation({
            method: 'set_offer',
            args: this.spec.funcArgsToScVals("set_offer", {offer}),
            ...options,
            ...this.options,
            errorTypes: Errors,
            parseResultXdr: this.parsers['setOffer'],
        });
    }


        /**
    * Construct and simulate a get_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
    */
    getOffer = async ({mft}: {mft: string}, options: {
        /**
         * The fee to pay for the transaction. Default: 100.
         */
        fee?: number,
    } = {}) => {
        return await AssembledTransaction.fromSimulation({
            method: 'get_offer',
            args: this.spec.funcArgsToScVals("get_offer", {mft: new Address(mft)}),
            ...options,
            ...this.options,
            errorTypes: Errors,
            parseResultXdr: this.parsers['getOffer'],
        });
    }


        /**
    * Construct and simulate a delete_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
    */
    deleteOffer = async ({mft}: {mft: string}, options: {
        /**
         * The fee to pay for the transaction. Default: 100.
         */
        fee?: number,
    } = {}) => {
        return await AssembledTransaction.fromSimulation({
            method: 'delete_offer',
            args: this.spec.funcArgsToScVals("delete_offer", {mft: new Address(mft)}),
            ...options,
            ...this.options,
            errorTypes: Errors,
            parseResultXdr: this.parsers['deleteOffer'],
        });
    }

}