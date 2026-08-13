export interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: 'image/webp' | 'image/jpeg';
}

export interface CompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    originalSizeFormatted: string;
    compressedSizeFormatted: string;
    savedPercentage: number;
    previewUrl: string;
    width: number;
    height: number;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Kompresi gambar di sisi klien (Browser/HP) sebelum diunggah ke server.
 * Mereduksi ukuran file hingga 80-95% dengan tetap menjaga ketajaman teks/angka timbangan.
 */
export async function compressImage(
    file: File,
    options: CompressOptions = {},
): Promise<CompressionResult> {
    const {
        maxWidth = 1600,
        maxHeight = 1600,
        quality = 0.75,
        mimeType = 'image/webp',
    } = options;

    // Jika bukan file gambar, kembalikan apa adanya
    if (!file.type.startsWith('image/')) {
        throw new Error('File yang dipilih bukan merupakan file gambar yang valid.');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (readerEvent) => {
            const img = new Image();

            img.onload = () => {
                let { width, height } = img;

                // Hitung dimensi proporsional agar tidak melebihi batas maksimum
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Gagal menginisialisasi canvas untuk kompresi.'));
                    return;
                }

                // Render gambar dengan smoothing berkualitas tinggi
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Ekspor ke WebP / JPEG
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Gagal menghasilkan file gambar terkompresi.'));
                            return;
                        }

                        // Buat ekstensi baru sesuai mimeType
                        const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
                        const baseName = file.name.replace(/\.[^/.]+$/, '');
                        const newFileName = `${baseName}.${extension}`;

                        const compressedFile = new File([blob], newFileName, {
                            type: mimeType,
                            lastModified: Date.now(),
                        });

                        const originalSize = file.size;
                        const compressedSize = compressedFile.size;
                        const savedRatio =
                            originalSize > 0
                                ? Math.max(0, ((originalSize - compressedSize) / originalSize) * 100)
                                : 0;

                        const previewUrl = URL.createObjectURL(blob);

                        resolve({
                            file: compressedFile,
                            originalSize,
                            compressedSize,
                            originalSizeFormatted: formatBytes(originalSize),
                            compressedSizeFormatted: formatBytes(compressedSize),
                            savedPercentage: Math.round(savedRatio),
                            previewUrl,
                            width,
                            height,
                        });
                    },
                    mimeType,
                    quality,
                );
            };

            img.onerror = () => {
                reject(new Error('Format gambar tidak dapat dibaca atau rusak.'));
            };

            img.src = readerEvent.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Gagal membaca file gambar dari perangkat.'));
        };

        reader.readAsDataURL(file);
    });
}
