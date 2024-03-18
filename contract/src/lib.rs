#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, log, symbol_short, token, Address, Env, Map, String, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Offer {
    mft: String, 
    amount: i128, 
    list_price: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Owner {
    public_key: Address, 
    amount: i128, 
    mft: String,
}

const OFFERS_KEY: Symbol = symbol_short!("offers");
const OWNERS_KEY: Symbol = symbol_short!("owners");

fn get_xlm_address(e: &Env) -> Address {
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
}

#[contract]
pub struct MusicNFTs;

#[contractimpl]
impl MusicNFTs {

    pub fn buy(e: Env, buyer:Address, mft: String, amount: i128) {
        buyer.require_auth();

        let offers = Self::get_offers(&e);
        if let Some(offer) = offers.get(mft.clone()) {
                assert!(offer.amount >= amount, "amount must less or equal to the current offer");

                log!(&e, "Buying NFT.");
                // let xlm_address = get_xlm_address(&e);
                // let xlm = token::Client::new(&e, &xlm_address);
    
                // let total_xlm = offer.list_price * (amount / 100);
                // xlm.transfer(&buyer, &e.current_contract_address(), &total_xlm);

                // let mut updated_offer = offer;
                // updated_offer.amount = updated_offer.amount - amount;

                // if updated_offer.amount == 0 {
                //     Self::delete_offer(e.clone(), updated_offer.mft);
                // } else {
                //     Self::update_offer(e.clone(), updated_offer);
                // }

                //  // record ownership

                //  let res = Self::get_ownership(e.clone(), mft.clone(), buyer.clone());

                //  if res.is_some() {
                //     let mut owner = res.unwrap();
                //     owner.amount = owner.amount + amount;
                //     Self::update_owner(e.clone(), owner)
                //  } else {
                //      let owner = Owner { public_key: buyer, amount: amount, mft: mft };
                //      Self::update_owner(e.clone(), owner)
                //  }
            }
        
        log!(&e, "Offer not found or insufficient amount.");
    }

    pub fn update_offer(e: Env, new_offer: Offer) {
        assert!(new_offer.amount > 0, "amount must be positive");
        assert!(new_offer.amount <= 100, "amount less than 100");
        let mut all_offers = Self::get_offers(&e);
        all_offers.set(new_offer.mft.clone(), new_offer);

        e.storage().instance().set(&OFFERS_KEY, &all_offers);
    }

    pub fn update_owner(e: Env, new_owner: Owner) {
        assert!(new_owner.amount > 0, "amount must be positive");
        assert!(new_owner.amount <= 100, "amount less than 100");
        let mut all_owners = Self::get_owners(&e);
        let mft = new_owner.mft.clone();
        let mut owners = all_owners.get(mft.clone()).unwrap_or_else(|| Map::new(&e));
        owners.set(new_owner.public_key.clone(), new_owner);
        all_owners.set(mft, owners);

        e.storage().instance().set(&OWNERS_KEY, &all_owners);
    }

    pub fn get_ownership(e: Env, mft: String, owner: Address) ->  Option<Owner>{
        let all_mfts_owners = Self::get_owners(&e);
        let owners = all_mfts_owners.get(mft.clone()).unwrap_or_else(|| Map::new(&e));
        return owners.get(owner.clone());
    }

    pub fn update_offers(e: Env, offers: Vec<Offer>) {
        // Bulk update logic
        for offer in offers.into_iter() {
            Self::update_offer(e.clone(), offer);
        }
    }

    pub fn delete_offer(e: Env, mft: String){
        let mut all_offers: Map<String, Offer> = Self::get_offers(&e);

        all_offers.remove(mft);

        e.storage().instance().set(&OFFERS_KEY, &all_offers);
    }

    pub fn get_offers(e: &Env) -> Map<String, Offer> {
        e.storage().instance().get(&OFFERS_KEY).unwrap_or_else(|| Map::new(e))
    }

    pub fn get_owners(e: &Env) -> Map<String, Map<Address,Owner>> {
        e.storage().instance().get(&OWNERS_KEY).unwrap_or_else(|| Map::new(e))
    }
}

