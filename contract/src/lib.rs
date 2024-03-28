#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, log, token, Address, Env, String};

#[contracttype]
pub enum DataKey {
    Offers(Address),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Offer {
    mft: Address,
    amount: i128,
    list_price: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Owner {
    public_key: Address,
    amount: i128,
    mft: Address,
}

#[contract]
pub struct MusicNFTs;

#[contractimpl]
impl MusicNFTs {
    pub fn buy(e: Env, buyer: Address, mft: Address, amount: i128) {
        buyer.require_auth();

        // let offer = Self::get_offer(&e, mft.clone());
        // assert!(offer.amount >= amount, "amount must be less or equal to the current offer");

        // log!(&e, "Buying NFT.");
        // let xlm_address = get_xlm_address(&e);
        // let xlm = token::Client::new(&e, &xlm_address);

        // let total_xlm = offer.list_price * (amount / 100) * 1000000;
        // xlm.transfer(&buyer, &e.current_contract_address(), &total_xlm);

        // let mut updated_offer = offer;
        // updated_offer.amount -= amount;

        // if updated_offer.amount == 0 {
        //     Self::delete_offer(e.clone(), mft.clone());
        // } else {
        //     Self::set_offer(e.clone(), updated_offer);
        // }
    }

    pub fn balance(e: Env, address: Address) -> i128 {
        let xlm_address = get_xlm_address(&e);
        let xlm = token::Client::new(&e, &xlm_address);
        xlm.balance(&address)
    }

    pub fn set_offer(e: Env, offer: Offer) {
        let key = DataKey::Offers(offer.mft.clone());

        e.storage().instance().set(&key, &offer);
    }
    

    pub fn get_offer(e: &Env, mft: Address) -> Offer {
        let key = DataKey::Offers(mft);

        e.storage().instance().get(&key).unwrap()
    }

    pub fn delete_offer(e: Env, mft: Address) {
        let key = DataKey::Offers(mft);

        e.storage().instance().remove(&key);
    }

    // The rest of the contract methods...
}

fn get_xlm_address(e: &Env) -> Address {
    // Implementation remains unchanged...
     // public xlm
    // return Address::from_string(&String::from_str(
    //  &e,
    //     "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
    // ));

    // testnet
    return Address::from_string(&String::from_str(
        &e,
        "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    )); 

    // futurenet 
    // return Address::from_string(&String::from_str(
    //     &e,
    //     "CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT",
    // ));
}
