/**
 * src/lib/image-optimizer.ts
 *
 * Lightweight Image & Avatar Optimization Helper.
 * Resizes and compresses uploaded images on the client before upload/storage
 * to ensure database queries and page renders remain ultra-fast (< 40KB per avatar).
 */

export async function compressAvatarImage(file: File): Promise<{
  fullUrl: string;
  thumbnailUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // 1. Create Lightweight Thumbnail (128x128px)
        const thumbDim = 128;
        canvas.width = thumbDim;
        canvas.height = thumbDim;

        if (ctx) {
          ctx.drawImage(img, 0, 0, thumbDim, thumbDim);
        }
        const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);

        // 2. Create Optimized Profile Avatar (300x300px)
        const profileDim = 300;
        canvas.width = profileDim;
        canvas.height = profileDim;

        if (ctx) {
          ctx.drawImage(img, 0, 0, profileDim, profileDim);
        }
        const fullUrl = canvas.toDataURL("image/jpeg", 0.85);

        resolve({ fullUrl, thumbnailUrl });
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}
