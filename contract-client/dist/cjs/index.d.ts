import { ContractSpec } from '@stellar/stellar-sdk';
import { AssembledTransaction } from './assembled-tx.js';
import type { i128 } from './assembled-tx.js';
import type { ClassOptions } from './method-options.js';
export * from './assembled-tx.js';
export * from './method-options.js';
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CBKPY5UKSG5PLW6WL7BKE5JTTUINCD5EWQWXLCD74EYNOBFIRADP4ADY";
    };
};
/**
    
    */
export type DataKey = {
    tag: "Offers";
    values: readonly [string];
};
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
export declare const Errors: {};
export declare class Contract {
    readonly options: ClassOptions;
    spec: ContractSpec;
    constructor(options: ClassOptions);
    private readonly parsers;
    private txFromJSON;
    readonly fromJSON: {
        buy: (json: string) => AssembledTransaction<void>;
        balance: (json: string) => AssembledTransaction<bigint>;
        setOffer: (json: string) => AssembledTransaction<void>;
        getOffer: (json: string) => AssembledTransaction<Offer>;
        deleteOffer: (json: string) => AssembledTransaction<void>;
    };
    /**
* Construct and simulate a buy transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    buy: ({ buyer, mft, amount }: {
        buyer: string;
        mft: string;
        amount: i128;
    }, options?: {
        /**
         * The fee to pay for the transaction. Default: 100.
         */
        fee?: number;
    }) => Promise<AssembledTransaction<void>>;
    /**
* Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    balance: ({ address }: {
        address: string;
    }, options?: {
        /**
         * The fee to pay for the transaction. Default: 100.
         */
        fee?: number;
    }) => Promise<AssembledTransaction<bigint>>;
    /**
* Construct and simulate a set_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    setOffer: ({ offer }: {
        offer: Offer;
    }, options?: {
        /**
         * The fee to pay for the transaction. Default: 100.
         */
        fee?: number;
    }) => Promise<AssembledTransaction<void>>;
    /**
* Construct and simulate a get_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    getOffer: ({ mft }: {
        mft: string;
    }, options?: {
        /**
         * The fee to pay for the transaction. Default: 100.
         */
        fee?: number;
    }) => Promise<AssembledTransaction<Offer>>;
    /**
* Construct and simulate a delete_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    deleteOffer: ({ mft }: {
        mft: string;
    }, options?: {
        /**
         * The fee to pay for the transaction. Default: 100.
         */
        fee?: number;
    }) => Promise<AssembledTransaction<void>>;
}
