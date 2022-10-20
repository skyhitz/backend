import { GraphQLString } from 'graphql';
import { GraphQLUser } from './types/user';
import { getAuthenticatedUser } from '../auth/logic';
import * as yup from 'yup';
import {
  getByUsernameOrEmailExcludingId,
  usersIndex,
} from 'src/algolia/algolia';
import axios from 'axios';
import { pinataApi } from 'src/constants/constants';
import { ipfsProtocol } from '../constants/constants';
import { Config } from 'src/config';

type UpdateUserArgs = {
  avatarUrl?: string | null;
  displayName?: string | null;
  description?: string | null;
  username?: string | null;
  email?: string | null;
};

const updateUserSchema: yup.SchemaOf<UpdateUserArgs> = yup.object().shape({
  avatarUrl: yup.string(),
  description: yup.string(),
  username: yup
    .string()
    .required('Username is required.')
    .min(2, 'Username is minimum 2 characters.')
    .lowercase('Username must be lowercase')
    .matches(
      /^[a-z0-9_-]+$/,
      'Usernames cannot have spaces or special characters'
    ),
  displayName: yup
    .string()
    .required('Display name is required.')
    .min(2, 'Display name is minimum 2 characters.'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email.'),
});

const updateUserEndpoint = {
  type: GraphQLUser,
  args: {
    avatarUrl: {
      type: GraphQLString,
    },
    displayName: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    username: {
      type: GraphQLString,
    },
    email: {
      type: GraphQLString,
    },
  },
  async resolve(_: any, updateUserArgs: UpdateUserArgs, ctx: any) {
    const user = await getAuthenticatedUser(ctx);
    const validatedUpdate = await updateUserSchema.validate(updateUserArgs, {
      stripUnknown: true,
    });
    const existingUser = await getByUsernameOrEmailExcludingId(
      validatedUpdate.username,
      validatedUpdate.email,
      user.id
    );
    if (existingUser) {
      if (existingUser.email === validatedUpdate.email) {
        throw 'Account with given email already exists';
      }
      if (existingUser.username === validatedUpdate.username) {
        throw 'Username is already taken';
      }
    }
    if (validatedUpdate.avatarUrl) {
      const result = await axios
        .post(
          `${pinataApi}/pinning/pinByHash`,
          {
            hashToPin: validatedUpdate.avatarUrl.replace(ipfsProtocol, ''),
            pinataMetadata: {
              name: `${user.username}-image`,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${Config.PINATA_JWT}`,
              'Content-Type': 'application/json',
            },
          }
        )
        .then(({ data }) => data)
        .catch((error) => {
          console.log(error);
          return null;
        });
      if (!result) {
        throw "Couldn't pin image to pinata!";
      }
      console.log('Pinned image!');
    }
    const userUpdate = {
      ...user,
      ...validatedUpdate,
    };
    await usersIndex.partialUpdateObject(userUpdate);
    return userUpdate;
  },
};

export default updateUserEndpoint;
