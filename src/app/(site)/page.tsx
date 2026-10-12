import { getCatalog } from "@/lib/data";
import { GENERAL_ENQUIRY, waLink } from "@/lib/whatsapp";
import { Header } from "@/components/site/Header";
import { Collection } from "@/components/site/Collection";
import { WaIcon } from "@/components/site/Icons";

// Rendered per request; the DB query itself is cached and invalidated by admin edits.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { products, categories, settings } = await getCatalog();
  const wa = waLink(settings.whatsappNumber, GENERAL_ENQUIRY);
  const waProps = { href: wa, target: "_blank", rel: "noopener" };
  const pick = (id: string, fallback: number) => products.find(p => String(p.id) === id) ?? products[fallback];
  const hero = pick(settings.heroProductId, 0);
  const chip = pick(settings.heroChipProductId, 1);

  return (
    <>
      <Header />
      <main>
        <section id="hero">
          <div className="wrap hero-grid">
            <div>
              <p className="eyebrow">DECOR • GIFTING • ELEGANCE</p>
              <h1>Beautiful pieces, thoughtfully chosen.</h1>
              <p className="lead">
                Premium decor and gifting pieces for the moments you want to remember: from festive tables and pooja rooms to wedding gifts and thoughtful presents.
              </p>
              <ul className="occ">
                <li>Festive gifting</li><li>Weddings</li><li>Housewarming</li><li>Corporate gifting</li><li>Celebrations</li>
              </ul>
              <div className="cta-row">
                <a className="btn" href="#collection">Explore Collection</a>
                <a className="btn ghost" {...waProps}>Chat on WhatsApp</a>
              </div>
            </div>
            <div className="hero-art">
              <div className="arch">{hero && <img src={hero.image} alt={hero.name} />}</div>
              {chip && <div className="chip"><img src={chip.image} alt={chip.name} /></div>}
            </div>
          </div>
        </section>

        <Collection products={products} categories={categories} whatsappNumber={settings.whatsappNumber} />

        <section id="about">
          <div className="wrap">
            <div className="about-grid">
              <div>
                <p className="eyebrow">ABOUT DECOWN</p>
                <h2>Thoughtful pieces for meaningful moments.</h2>
              </div>
              <div className="story">
                <p>Decown brings together carefully selected decor and gifting pieces designed to make celebrations, spaces and special occasions more memorable.</p>
                <p style={{ marginTop: 16 }}>From silver serving sets in velvet gift boxes to pichwai-inspired jars, trays and diyas, every piece is chosen to feel festive, traditional and gift-ready.</p>
              </div>
            </div>
            <div className="why">
              <div><h3>Premium selection</h3><p>Carefully selected pieces for gifting and decor.</p></div>
              <div><h3>Made for moments</h3><p>Suited to festivals, weddings, housewarmings and celebrations.</p></div>
              <div><h3>Easy enquiry</h3><p>Find a piece you love and enquire directly on WhatsApp.</p></div>
              <div><h3>Personal and bulk</h3><p>Ask us about single gifts as well as larger requirements.</p></div>
            </div>
          </div>
        </section>

        <section id="contact">
          <div className="wrap">
            <p className="eyebrow">CONTACT</p>
            <h2 style={{ marginTop: 14 }}>Found something you love?</h2>
            <p>Tell us what you&apos;re looking for and we&apos;ll help you with the details.</p>
            <a className="btn wa" {...waProps}><WaIcon />Enquire on WhatsApp</a>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="foot">
            <div className="fbrand">
              <div className="flogo">
                <img src="/brand/logo-full.webp" width={640} height={628} alt="Decown logo: Decor that defines you" loading="lazy" />
              </div>
              <div>
                <a className="brand" href="#hero">
                  <span className="nm"><span className="logo">Decown</span><span className="hi" lang="hi">डेकओन</span></span>
                </a>
                <p>Curated decor &amp; gifting pieces for meaningful moments.</p>
                <div className="social">
                  {settings.instagramUrl && (
                    <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram — Decown" title="Instagram — Decown">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".9" fill="currentColor" stroke="none" /></svg>
                    </a>
                  )}
                  {settings.facebookUrl && (
                    <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook — Decown" title="Facebook — Decown">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8.2h2.8l.4-3.3h-3.2V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.3h2.8V22h3.4Z" /></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
            <ul>
              <li><a href="#collection">Collection</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a {...waProps}>WhatsApp</a></li>
            </ul>
          </div>
          <p className="copy">© {new Date().getFullYear()} Decown. All rights reserved.</p>
        </div>
      </footer>

      <a className="fab" {...waProps} aria-label="Chat with Decown on WhatsApp"><WaIcon /><span>WhatsApp</span></a>
    </>
  );
}
