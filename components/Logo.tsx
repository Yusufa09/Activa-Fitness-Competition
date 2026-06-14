// The Activa axolotl mark. Drop the image at public/axolotl.png.
export function Logo({ className = "w-6 h-6" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/axolotl.png" alt="Activa" className={className} />;
}
