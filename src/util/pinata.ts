import axios from 'axios';
import { Config } from '../config';
import { pinataApi } from '../constants/constants';

export async function pinIpfsFile(
  ipfsHash: string,
  name: string
): Promise<unknown> {
  return await axios
    .post(
      `${pinataApi}/pinning/pinByHash`,
      {
        hashToPin: ipfsHash,
        pinataMetadata: {
          name: name,
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
}
