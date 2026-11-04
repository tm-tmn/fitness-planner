/**
 * ย่อรูปในเบราว์เซอร์ก่อนส่งให้ AI (ด้านยาวสุด 800px, JPEG)
 * การวาดใหม่ลงแคนวาสทำให้ข้อมูล EXIF เช่น ตำแหน่ง GPS ไม่ติดไปกับรูป และรูปมีขนาดเล็กลงมาก
 */
export async function fileToJpegDataUrl(file: File, maxSide = 800, quality = 0.72): Promise<string> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  ctx.fillStyle = "#fff"; // PNG โปร่งใสจะได้ไม่กลายเป็นพื้นดำ
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap.source, 0, 0, w, h);
  if ("close" in bitmap.source && typeof bitmap.source.close === "function") bitmap.source.close();
  return canvas.toDataURL("image/jpeg", quality);
}

async function loadBitmap(
  file: File
): Promise<{ source: CanvasImageSource & { close?: () => void }; width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const b = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: b, width: b.width, height: b.height };
    } catch {
      // เบราว์เซอร์บางตัวไม่รองรับ option นี้ ใช้วิธี <img> แทน
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image_decode_failed"));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}
