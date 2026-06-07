import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";

export function SiteFooter() {
  const phone = "+966500000001";
  const email = "info@servicetime.sa";

  return (
    <footer className="site-footer relative rounded-t-[20px] bg-[#050B10] text-white">
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Link href="/" className="inline-block">
            <Image
              src="/logos/banner.png"
              alt="Service Time — سيرفيس تايم"
              width={280}
              height={72}
              className="h-14 w-auto max-w-full object-contain brightness-[1.12] contrast-[1.05]"
              unoptimized
            />
          </Link>
          <p className="mt-4 text-sm leading-7 text-white/85">
            منصة سعودية لصيانة السيارات وطلب قطع الغيار في الرياض — ورشة
            ثابتة أو فني متنقل مع تتبع مباشر.
          </p>
        </div>

        <div>
          <p className="font-semibold text-[#94D4B9]">روابط سريعة</p>
          <ul className="mt-3 space-y-2 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-normal text-white transition-all duration-200 hover:font-bold hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-[#94D4B9]">تواصل</p>
          <ul className="mt-3 space-y-2 text-sm text-white">
            <li
              dir="ltr"
              className="text-right font-normal transition-all duration-200 hover:font-bold"
            >
              {phone}
            </li>
            <li className="font-normal transition-all duration-200 hover:font-bold">
              {email}
            </li>
            <li className="text-white/85">الرياض، المملكة العربية السعودية</li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-[#94D4B9]/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Service Time. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
