import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql';

const Entry: GraphQLObjectType = new GraphQLObjectType({
  name: 'Entry',
  description: 'This is an Entry',
  fields: () => {
    return {
      imageUrl: {
        type: GraphQLString,
        resolve(entry: any) {
          return entry.imageUrl;
        },
      },
      videoUrl: {
        type: GraphQLString,
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
        type: GraphQLString,
        resolve(entry: any) {
          return entry.title;
        },
      },
      id: {
        type: GraphQLString,
        resolve(entry: any) {
          return entry.id;
        },
      },
      forSale: {
        type: GraphQLBoolean,
        resolve(entry: any) {
          return entry.forSale;
        },
      },
      price: {
        type: GraphQLInt,
        resolve(entry: any) {
          return entry.price;
        },
      },
      artist: {
        type: GraphQLString,
        resolve(entry: any) {
          return entry.artist;
        },
      },
    };
  },
});

export default Entry;
