import axios from 'axios';
import { Config } from '../config';
import { pinataApi } from '../constants/constants';
const FormData = require('form-data');

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

type PinRes = {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate: boolean;
};

export async function pinAssetUrl(url: string): Promise<PinRes> {
  console.log(url);
  const data = new FormData();
  const response = await axios.get(url, {
    responseType: 'stream',
  });

  data.append(`file`, response.data);
  const options = JSON.stringify({
    cidVersion: 1,
  });
  data.append('pinataOptions', options);

  const res = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    data,
    {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
        Authorization: `Bearer ${Config.PINATA_JWT}`,
      },
    }
  );
  return res.data as PinRes;
}
