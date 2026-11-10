import { Mail } from "lucide-react";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { SupportContactLink } from "@/components/support-contact-link";

export const metadata = {
  title: "Contact",
  description:
    "Contact the JobHunter team for product support, billing questions, or privacy requests.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100">
      <PublicSiteHeader />
      <main>
        <section className="border-b border-white/10 bg-[#12131a]">
          <div className="mx-auto max-w-4xl px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">
              Contact JobHunter
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              How can we help?
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Contact us about using JobHunter, your account or subscription,
              feedback, or a privacy request. We will direct your message to
              the right place.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-10 sm:px-10 sm:py-14 lg:px-16">
          <div className="rounded-2xl border border-white/10 bg-[#101119] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-200">
                <Mail className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Email support
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Send us a message and include enough detail for us to
                  understand your question. Please do not include passwords or
                  other sensitive login information.
                </p>
                <SupportContactLink className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
                  Email JobHunter support
                </SupportContactLink>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
