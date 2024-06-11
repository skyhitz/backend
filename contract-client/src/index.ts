import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
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
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CC5ELPSQFQMJ75XUPJARIODNA7UIH4RS36N37BAV4SVEBEDN4PJYVL5E",
  }
} as const

export type DataKey = {tag: "Index", values: void} | {tag: "Entries", values: readonly [string]};


export interface Entry {
  apr: i128;
  equity_shares: Map<string, i128>;
  escrow: i128;
  ipfs_hash: string;
  total_invested: i128;
}

export const Errors = {
  
}

export interface Client {
  /**
   * Construct and simulate a set_entry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_entry: ({entry}: {entry: Entry}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_entry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_entry: ({ipfs_hash}: {ipfs_hash: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Entry>>

  /**
   * Construct and simulate a invest transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  invest: ({user, ipfs_hash, amount}: {user: string, ipfs_hash: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a distribute_payout transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  distribute_payout: ({ipfs_hash}: {ipfs_hash: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a distribute_payouts transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  distribute_payouts: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAAAAAAAAAAABUluZGV4AAAAAAAAAQAAAAAAAAAHRW50cmllcwAAAAABAAAAEA==",
        "AAAAAQAAAAAAAAAAAAAABUVudHJ5AAAAAAAABQAAAAAAAAADYXByAAAAAAsAAAAAAAAADWVxdWl0eV9zaGFyZXMAAAAAAAPsAAAAEwAAAAsAAAAAAAAABmVzY3JvdwAAAAAACwAAAAAAAAAJaXBmc19oYXNoAAAAAAAAEAAAAAAAAAAOdG90YWxfaW52ZXN0ZWQAAAAAAAs=",
        "AAAAAAAAAAAAAAAJc2V0X2VudHJ5AAAAAAAAAQAAAAAAAAAFZW50cnkAAAAAAAfQAAAABUVudHJ5AAAAAAAAAA==",
        "AAAAAAAAAAAAAAAJZ2V0X2VudHJ5AAAAAAAAAQAAAAAAAAAJaXBmc19oYXNoAAAAAAAAEAAAAAEAAAfQAAAABUVudHJ5AAAA",
        "AAAAAAAAAAAAAAAGaW52ZXN0AAAAAAADAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAJaXBmc19oYXNoAAAAAAAAEAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAAAAAAARZGlzdHJpYnV0ZV9wYXlvdXQAAAAAAAABAAAAAAAAAAlpcGZzX2hhc2gAAAAAAAAQAAAAAA==",
        "AAAAAAAAAAAAAAASZGlzdHJpYnV0ZV9wYXlvdXRzAAAAAAAAAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    set_entry: this.txFromJSON<null>,
        get_entry: this.txFromJSON<Entry>,
        invest: this.txFromJSON<null>,
        distribute_payout: this.txFromJSON<null>,
        distribute_payouts: this.txFromJSON<null>
  }
}