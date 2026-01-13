import { MagickFormat, MagickImageCollection } from '@imagemagick/magick-wasm';

export function postProcessGif(gif: Buffer): Buffer {
    MagickImageCollection.create(gif).coalesce();
    const collection = MagickImageCollection.create(gif);
    collection.coalesce();
    return collection.write(MagickFormat.Gif, data => {
        return Buffer.from(data)
    });
}