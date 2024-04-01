import axios from 'axios';
import { Config } from '../config';
import { pinataApi } from '../constants/constants';
const FormData = require('form-data');

type PinRes = {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate: boolean;
};

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

  const res = await axios.post(`${pinataApi}/pinning/pinFileToIPFS`, data, {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
      Authorization: `Bearer ${Config.PINATA_JWT}`,
    },
  });
  return res.data as PinRes;
}

export async function pinJSON(centralizedMeta) {
  const body = {
    pinataContent: centralizedMeta,
    pinataOptions: { cidVersion: 1 },
  };

  const { data }: { data: PinRes } = await axios.post(
    `${pinataApi}/pinning/pinJSONToIPFS`,
    body,
    {
      headers: { Authorization: `Bearer ${Config.PINATA_JWT}` },
    }
  );

  return data.IpfsHash;
}
