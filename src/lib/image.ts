import { FriendlyError } from './format';

/** Largest saved picture, in characters of the data text (about 90 KB), far below Firestore's 1 MB limit. */
const MAX_CHARS = 120_000;

/**
 * Turns a photo chosen from the owner's phone or computer into a small JPG (data URL) that is saved
 * together with the product. Big camera photos are shrunk to fit, so uploads stay fast for customers.
 */
export async function imageFileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new FriendlyError('Please choose a picture file (JPG or PNG).');
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new FriendlyError('This picture could not be read. Please use a JPG or PNG file.');
  }

  for (const side of [480, 360, 260, 180]) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new FriendlyError('This browser cannot prepare the picture. Please try another browser.');
    context.fillStyle = '#ffffff'; // JPG has no transparency
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.75, 0.65, 0.55]) {
      const url = canvas.toDataURL('image/jpeg', quality);
      if (url.length <= MAX_CHARS) {
        bitmap.close();
        return url;
      }
    }
  }
  bitmap.close();
  throw new FriendlyError('This picture is too detailed to save. Please choose a simpler or smaller picture.');
}
