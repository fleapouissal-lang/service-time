export async function removeImageBackground(file: File | Blob): Promise<Blob> {
  const mod = await import("@imgly/background-removal");

  if (mod.preload) {
    await mod.preload({
      model: "isnet_quint8",
      output: {
        format: "image/png",
        quality: 0.92,
      },
    });
  }

  return mod.removeBackground(file, {
    model: "isnet_quint8",
    output: {
      format: "image/png",
      quality: 0.92,
    },
  });
}
