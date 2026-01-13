import { ImageMagick, initializeImageMagick, Magick, MagickFormat, MagickImageCollection, Quantum } from '@imagemagick/magick-wasm';
import { readFileSync } from 'fs';

const wasmLocation = 'node_modules/@imagemagick/magick-wasm/dist/magick.wasm';
const wasmBytes = readFileSync(wasmLocation);
initializeImageMagick(wasmBytes).then(() => {
    console.log(Magick.imageMagickVersion);
    console.log('Delegates:', Magick.delegates);
    console.log('Features:', Magick.features);
    console.log('Quantum:', Quantum.depth);
});

export function postProcessGif(webp: Buffer): Buffer {
    return ImageMagick.readCollection(webp, image => {
        image.coalesce();
        return image.write(MagickFormat.Gif, data => {
            return Buffer.from(data)
        });
    });
}