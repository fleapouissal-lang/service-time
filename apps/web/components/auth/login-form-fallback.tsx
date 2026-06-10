export function LoginFormFallback() {
  return (
    <section
      className="grid min-h-screen h-screen w-full grid-cols-1 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Loading login"
    >
      <div
        className="relative hidden overflow-hidden bg-[#050B10] bg-cover bg-center bg-no-repeat lg:flex lg:flex-col"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-black/60" aria-hidden />
      </div>
      <div className="relative flex items-center justify-center bg-[#060709] px-6 py-12">
        <div
          className="size-10 animate-spin rounded-full border-2 border-[#94D4B9]/30 border-t-[#94D4B9]"
          role="status"
          aria-hidden
        />
      </div>
    </section>
  );
}
