const images = import.meta.glob(
  "/src/assets/**/*.{png,jpg,jpeg,svg,webp,gif}",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

export const getImageSrc = (filename: string): string => {
  // Match by base filename to handle hashed production filenames
  const path = Object.keys(images).find((key) => key.endsWith(`/${filename}`));
  return path ? images[path] : "";
};
