import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';

export const EntryDetails: GraphQLObjectType = new GraphQLObjectType({
  name: 'EntryDetails',
  description: 'This is an EntryDetails',
  fields: () => {
    return {
      imageUrl: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(entry: any) {
          return entry.imageUrl;
        },
      },
      videoUrl: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(entry: any) {
          return entry.videoUrl;
        },
      },
      description: {
        type: GraphQLString,
        resolve(entry: any) {
          return entry.description;
        },
      },
      title: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(entry: any) {
          return entry.title;
        },
      },
      id: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(entry: any) {
          return entry.id;
        },
      },
      artist: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(entry: any) {
          return entry.artist;
        },
      },
      code: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(entry: any) {
          return entry.code;
        },
      },
      issuer: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(entry: any) {
          return entry.issuer;
        },
      },
      holders: {
        type: new GraphQLList(new GraphQLNonNull(EntryHolder)),
        resolve(entry: any) {
          return entry.holders;
        },
      },
      history: {
        type: new GraphQLList(new GraphQLNonNull(EntryActivity)),
        resolve(entry: any) {
          return entry.history;
        },
      },
      offers: {
        type: new GraphQLList(new GraphQLNonNull(EntryActivity)),
        resolve(entry: any) {
          return entry.offers;
        },
      },
    };
  },
});

const EntryHolder: GraphQLObjectType = new GraphQLObjectType({
  name: 'EntryHolder',
  description: 'This is an EntryHolder',
  fields: () => {
    return {
      account: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(holder: any) {
          return holder.account;
        },
      },
      balance: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(holder: any) {
          return holder.balance;
        },
      },
    };
  },
});

const EntryActivity: GraphQLObjectType = new GraphQLObjectType({
  name: 'EntryActivity',
  description: 'This is an EntryActivity',
  fields: () => {
    return {
      id: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(activity: any) {
          return activity.id;
        },
      },
      type: {
        type: new GraphQLNonNull(GraphQLInt),
        resolve(activity: any) {
          return activity.type;
        },
      },
      ts: {
        type: new GraphQLNonNull(GraphQLInt),
        resolve(activity: any) {
          return activity.ts;
        },
      },
      accounts: {
        type: new GraphQLList(GraphQLString),
        resolve(activity: any) {
          return activity.accounts;
        },
      },
      assets: {
        type: new GraphQLList(GraphQLString),
        resolve(activity: any) {
          return activity.assets;
        },
      },
      tx: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(activity: any) {
          return activity.tx;
        },
      },
      offer: {
        type: GraphQLString,
        resolve(activity: any) {
          return activity.offer;
        },
      },
      createdOffer: {
        type: GraphQLString,
        resolve(activity: any) {
          return activity.created_offer;
        },
      },
      amount: {
        type: GraphQLString,
        resolve(activity: any) {
          return activity.amount;
        },
      },
      sourceAmount: {
        type: GraphQLString,
        resolve(activity: any) {
          return activity.source_amount;
        },
      },
      price: {
        type: ActivityPrice,
        resolve(activity: any) {
          return activity.price;
        },
      },
    };
  },
});

const ActivityPrice: GraphQLObjectType = new GraphQLObjectType({
  name: 'ActivityPrice',
  description: 'This is an ActivityPrice',
  fields: () => {
    return {
      n: {
        type: new GraphQLNonNull(GraphQLInt),
        resolve(price: any) {
          return price.n;
        },
      },
      d: {
        type: new GraphQLNonNull(GraphQLInt),
        resolve(price: any) {
          return price.d;
        },
      },
    };
  },
});
