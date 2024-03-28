"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contract = exports.Errors = exports.networks = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const buffer_1 = require("buffer");
const assembled_tx_js_1 = require("./assembled-tx.js");
__exportStar(require("./assembled-tx.js"), exports);
__exportStar(require("./method-options.js"), exports);
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || buffer_1.Buffer;
}
exports.networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CBKPY5UKSG5PLW6WL7BKE5JTTUINCD5EWQWXLCD74EYNOBFIRADP4ADY",
    }
};
/**
    
    */
exports.Errors = {};
class Contract {
    options;
    spec;
    constructor(options) {
        this.options = options;
        this.spec = new stellar_sdk_1.ContractSpec([
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
        return assembled_tx_js_1.AssembledTransaction.fromJSON({
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
        return await assembled_tx_js_1.AssembledTransaction.fromSimulation({
            method: 'buy',
            args: this.spec.funcArgsToScVals("buy", { buyer: new stellar_sdk_1.Address(buyer), mft: new stellar_sdk_1.Address(mft), amount }),
            ...options,
            ...this.options,
            errorTypes: exports.Errors,
            parseResultXdr: this.parsers['buy'],
        });
    };
    /**
* Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    balance = async ({ address }, options = {}) => {
        return await assembled_tx_js_1.AssembledTransaction.fromSimulation({
            method: 'balance',
            args: this.spec.funcArgsToScVals("balance", { address: new stellar_sdk_1.Address(address) }),
            ...options,
            ...this.options,
            errorTypes: exports.Errors,
            parseResultXdr: this.parsers['balance'],
        });
    };
    /**
* Construct and simulate a set_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    setOffer = async ({ offer }, options = {}) => {
        return await assembled_tx_js_1.AssembledTransaction.fromSimulation({
            method: 'set_offer',
            args: this.spec.funcArgsToScVals("set_offer", { offer }),
            ...options,
            ...this.options,
            errorTypes: exports.Errors,
            parseResultXdr: this.parsers['setOffer'],
        });
    };
    /**
* Construct and simulate a get_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    getOffer = async ({ mft }, options = {}) => {
        return await assembled_tx_js_1.AssembledTransaction.fromSimulation({
            method: 'get_offer',
            args: this.spec.funcArgsToScVals("get_offer", { mft: new stellar_sdk_1.Address(mft) }),
            ...options,
            ...this.options,
            errorTypes: exports.Errors,
            parseResultXdr: this.parsers['getOffer'],
        });
    };
    /**
* Construct and simulate a delete_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    deleteOffer = async ({ mft }, options = {}) => {
        return await assembled_tx_js_1.AssembledTransaction.fromSimulation({
            method: 'delete_offer',
            args: this.spec.funcArgsToScVals("delete_offer", { mft: new stellar_sdk_1.Address(mft) }),
            ...options,
            ...this.options,
            errorTypes: exports.Errors,
            parseResultXdr: this.parsers['deleteOffer'],
        });
    };
}
exports.Contract = Contract;
