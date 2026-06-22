import sharp from 'sharp';
import fetch from 'node-fetch';

/**
 * Downloads the source image directly from Supabase to Node memory,
 * executes Sharp algorithms, and channels back as an immutable stream segment.
 */
export default async function processJob(sourceUrl, targetFormat, supabase) {
  // 1. Load buffer directly into memory from the cloud
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error('Data segment fault: Failed to retrieve file from remote Storage');
  const buffer = await response.arrayBuffer();
  const fileBuffer = Buffer.from(buffer);

  // 2. Intensive node-level conversion
  let convertedBuffer;
  if (targetFormat === 'webp') {
    convertedBuffer = await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
  } else if (targetFormat === 'png') {
    convertedBuffer = await sharp(fileBuffer).png().toBuffer();
  } else if (targetFormat === 'jpg') {
    convertedBuffer = await sharp(fileBuffer).jpeg({ quality: 80 }).toBuffer();
  } else {
    throw new Error('Format allocation mapping error: Unsupported engine constraint');
  }

  // 3. Write securely to Supabase Bucket Space
  const fileName = `converted/${Date.now()}_result.${targetFormat}`;
  const { error: uploadError } = await supabase.storage
    .from('files')
    .upload(fileName, convertedBuffer, {
      contentType: `image/${targetFormat}`,
      upsert: false
    });

  if (uploadError) throw uploadError;

  // 4. Expose the verified payload
  const { data: publicData } = supabase.storage.from('files').getPublicUrl(fileName);
  
  return publicData.publicUrl;
}
