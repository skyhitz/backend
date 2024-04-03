import axios from 'axios';
import { ipfsGateway } from 'src/constants/constants';

const sharp = require('sharp');

export async function fetchAndConvertImage(initialUrl) {
  let url = '';
  if (initialUrl.includes('ar://')) {
    url = initialUrl.replace('ar://', 'https://arweave.net/');
  }
  if (initialUrl.includes('ipfs://')) {
    url = initialUrl.replace('ipfs://', `${ipfsGateway}/`);
  }

  const imageUrl = url ? url : initialUrl;
  try {
    // Fetch the image with axios
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    // Using sharp to detect format and potentially convert
    const metadata = await sharp(buffer).metadata();

    if (
      metadata.format === 'gif' ||
      (metadata.format === 'webp' && metadata.pages > 1)
    ) {
      // It's a GIF or an animated WEBP, convert to static WEBP
      console.log('Converting to static WEBP...');
      const convertedBuffer = await sharp(buffer).webp().toBuffer();
      console.log('Conversion complete.');
      return convertedBuffer as Buffer;
    } else {
      // No conversion needed, return original buffer
      console.log('Image is not a GIF or animated WEBP. No conversion needed.');
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    throw error; // Rethrow to handle it outside the function
  }
}
