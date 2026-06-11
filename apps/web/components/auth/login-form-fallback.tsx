import Image from "next/image";

export function LoginFormFallback() {
  return (
    <section
      className="grid w-full grid-cols-1 max-lg:min-h-[calc(100dvh-3.5rem-5.25rem-env(safe-area-inset-bottom))] lg:min-h-screen lg:h-screen lg:grid-cols-2"
      aria-busy="true"
      aria-label="Loading login"
    >
      <div className="relative hidden overflow-hidden bg-[#050B10] lg:flex lg:flex-col">
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/60" aria-hidden />
      </div>
      <div className="relative flex min-h-full items-center justify-center bg-[#060709] px-6 py-12">
        <div
          className="size-10 animate-spin rounded-full border-2 border-[#94D4B9]/30 border-t-[#94D4B9]"
          role="status"
          aria-hidden
        />
      </div>
    </section>
  );
}
