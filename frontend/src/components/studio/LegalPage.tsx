import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <>
      <article className="shell max-w-3xl py-12 sm:py-20">
        <Link href="/" className="text-link muted mb-10">
          <ArrowLeft size={14} /> Back to exploring
        </Link>
        <p className="eyebrow muted mb-4">THE IMPORTANT DETAILS</p>
        <h1 className="display text-4xl sm:text-5xl">{title}</h1>
        <p className="muted mb-10 mt-6 text-base leading-8">{intro}</p>
        {sections.map((section) => (
          <section key={section.title} className="border-t line py-7">
            <h2 className="mb-3 text-lg font-semibold">{section.title}</h2>
            <p className="muted text-base leading-8">{section.body}</p>
          </section>
        ))}
      </article>
      <Footer />
    </>
  );
}
