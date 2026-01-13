import sharp from 'sharp';

export async function postProcessGif(webp: Buffer): Promise<Buffer> {
    try {
        const result = await sharp(webp, {pages: -1})
            .gif({
                colors: 255,
                dither: 0,
            })
            .toBuffer();
        return result;
    } catch (err) {
        console.error('Error processing GIF:', err);
        throw err;
    }
}