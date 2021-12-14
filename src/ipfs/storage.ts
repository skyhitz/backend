import { storeIpfsBuildTx } from 'stellar-nft.storage';
import { NFTPayload } from 'stellar-nft.storage/src/types';

export async function getBufferFromStream(createReadStream): Promise<Buffer> {
  const stream = createReadStream();
  const data = [];
  stream.on('data', (chunk) => {
    data.push(chunk);
  });

  return new Promise(() => {
    stream.on('end', (resolve, reject) => {
      resolve(Buffer.concat(data));
    });
  });
}

export async function buildNFT(
  accountPublicKey,
  { name, description, code, domain, supply },
  { imgMimetype, imgCreateReadStream },
  { videoMimetype, videoCreateReadStream }
) {
  const [imgBuffer, videoBuffer] = [
    await getBufferFromStream(imgCreateReadStream),
    await getBufferFromStream(videoCreateReadStream),
  ];

  const fileName = name
    .split(' ')
    .join('-')
    .toLowerCase()
    .replace(/\-\-+/g, '-');
  const imageFileExtension = `.${imgMimetype.split('/').pop()}`;
  const videoFileExtension = `.${videoMimetype.split('/').pop()}`;
  const imageFilename = `${fileName}${imageFileExtension}`;
  const videoFilename = `${fileName}${videoFileExtension}`;

  const payload: NFTPayload = {
    name: name,
    description: description,
    code: code,
    domain: domain,
    supply: supply,
    image: {
      fileName: imageFilename,
      data: imgBuffer,
      type: imgMimetype,
    },
    video: {
      fileName: videoFilename,
      data: videoBuffer,
      type: videoMimetype,
    },
  };

  return await storeIpfsBuildTx(accountPublicKey, payload);
}
