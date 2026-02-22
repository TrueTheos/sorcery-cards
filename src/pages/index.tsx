import { useState, useMemo } from "react";
import { GetStaticProps } from "next";
import Head from "next/head";
import fs from "fs";
import path from "path";

type Card = { name: string; slug: string; type: string };

export const getStaticProps: GetStaticProps = async () => {
  const filePath = path.join(process.cwd(), "public", "processed_cards.json");
  const cards = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Card[];
  return { props: { cards } };
};

function BlurImage({
  slug,
  alt,
  delay = 0,
}: {
  slug: string;
  alt: string;
  delay?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [showFull, setShowFull] = useState(delay === 0);

  return (
    <div
      style={styles.blurWrap}
      ref={(el) => {
        if (el && delay > 0 && !showFull) {
          setTimeout(() => setShowFull(true), delay);
        }
      }}
    >
      {/* Blur placeholder - always present, fades out */}
      <img
        src={`/cards/3/${slug}.webp`}
        alt=""
        aria-hidden
        style={{
          ...styles.blurImg,
          filter: "blur(8px)",
          transform: "scale(1.1)",
          opacity: loaded ? 0 : 1,
        }}
      />
      {/* Full image - delayed to show the blur effect in demo */}
      {showFull && (
        <img
          src={`/cards/${slug}.webp`}
          alt={alt}
          onLoad={() => setLoaded(true)}
          style={{
            ...styles.blurImg,
            opacity: loaded ? 1 : 0,
          }}
        />
      )}
    </div>
  );
}

const DEMO_SLUGS = ["abundance", "accursed_tower", "acid_rain"];

function BlurDemo() {
  const [key, setKey] = useState(0);

  return (
    <div style={styles.blurDemo}>
      <div style={styles.blurDemoCards}>
        {DEMO_SLUGS.map((slug, i) => (
          <BlurImage key={`${slug}-${key}`} slug={slug} alt={slug} delay={i * 600 + 500} />
        ))}
      </div>
      <button
        onClick={() => setKey((k) => k + 1)}
        style={styles.replayBtn}
      >
        Replay
      </button>
    </div>
  );
}

const BLUR_CODE = `function BlurImage({ slug, alt }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ position: "relative", aspectRatio: "5/7" }}>
      {/* Blur placeholder */}
      <img
        src={\`/cards/3/\${slug}.webp\`}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", filter: "blur(8px)",
          transition: "opacity 0.4s",
          opacity: loaded ? 0 : 1,
        }}
      />
      {/* Full quality */}
      <img
        src={\`/cards/\${slug}.webp\`}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          transition: "opacity 0.4s",
          opacity: loaded ? 1 : 0,
        }}
      />
    </div>
  );
}`;

const TYPES = [
  "all",
  "minion",
  "magic",
  "site",
  "aura",
  "artifact",
  "avatar",
] as const;

export default function Home({ cards }: { cards: Card[] }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return cards.filter((c) => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.slug.includes(q);
    });
  }, [cards, query, typeFilter]);

  function copyUrl(slug: string) {
    const url = `${window.location.origin}/cards/${slug}.webp`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1500);
  }

  return (
    <>
      <Head>
        <title>Sorcery Card Images</title>
        <meta
          name="description"
          content="Image CDN for Sorcery TCG card images"
        />
      </Head>

      <div style={styles.page}>
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.title}>Sorcery Card Images</h1>
          <p style={styles.subtitle}>
            Image CDN for{" "}
            <a href="https://spells.bar" style={styles.link}>
              spells.bar
            </a>
          </p>
        </header>

        {/* Usage Docs */}
        <section style={styles.docs}>
          <h2 style={styles.docsTitle}>Usage</h2>
          <p style={styles.docsText}>
            Card images are served as WebP at multiple quality levels. Use the
            slug from the table below to build URLs:
          </p>
          <div style={styles.codeBlockWrap}>
            <pre style={styles.codeBlock}>
              {`# Full quality (q90)
/cards/{slug}.webp

# Thumbnail (q10)
/cards/10/{slug}.webp

# Blur placeholder / LQIP (q3, 64px wide)
/cards/3/{slug}.webp`}
            </pre>
          </div>
          <p style={styles.docsText}>
            Example for <strong>Abundance</strong>:
          </p>
          <div style={styles.exampleRow}>
            {[
              { path: "cards/abundance.webp", label: "q90" },
              { path: "cards/10/abundance.webp", label: "q10" },
              { path: "cards/3/abundance.webp", label: "q3" },
            ].map((ex) => (
              <div key={ex.label} style={styles.exampleCard}>
                <img
                  src={`/${ex.path}`}
                  alt={`Abundance ${ex.label}`}
                  style={styles.exampleImg}
                  loading="lazy"
                />
                <code style={styles.exampleCode}>
                  /{ex.path}
                  <br />
                  <span style={styles.exampleLabel}>{ex.label}</span>
                </code>
              </div>
            ))}
          </div>
          {/* Progressive Blur Loading */}
          <h2 style={{ ...styles.docsTitle, marginTop: "1.25rem" }}>
            Progressive Blur Loading
          </h2>
          <p style={styles.docsText}>
            Use the <code style={styles.inlineCode}>/cards/3/</code> LQIP
            images as blur placeholders that fade into the full image once
            loaded. The tiny placeholder (~1-2KB) loads instantly while the full
            image streams in behind it.
          </p>
          <BlurDemo />
          <p style={styles.docsText}>React example:</p>
          <div style={styles.codeBlockWrap}>
            <pre style={styles.codeBlock}>{BLUR_CODE}</pre>
          </div>

          <p style={styles.docsText}>
            Full card list:{" "}
            <a href="/processed_cards.json" style={styles.link}>
              /processed_cards.json
            </a>{" "}
            &middot; Token list:{" "}
            <a href="/tokens.json" style={styles.link}>
              /tokens.json
            </a>
          </p>
        </section>

        {/* Search & Filters */}
        <section style={styles.controls}>
          <input
            type="text"
            placeholder="Search by name or slug..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.searchInput}
          />
          <div style={styles.filters}>
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  ...styles.filterBtn,
                  ...(typeFilter === t ? styles.filterBtnActive : {}),
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <p style={styles.count}>
            {filtered.length} of {cards.length} cards
          </p>
        </section>

        {/* Card Grid */}
        <div style={styles.grid}>
          {filtered.slice(0, 200).map((card) => (
            <div key={card.slug} style={styles.card}>
              <img
                src={`/cards/10/${card.slug}.webp`}
                alt={card.name}
                style={styles.cardImg}
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.src.includes("/cards/10/")) return;
                  img.src = `/cards/${card.slug}.webp`;
                }}
              />
              <div style={styles.cardInfo}>
                <span style={styles.cardName}>{card.name}</span>
                <code
                  style={styles.cardSlug}
                  onClick={() => copyUrl(card.slug)}
                  title="Click to copy full URL"
                >
                  {copiedSlug === card.slug ? "copied!" : card.slug}
                </code>
                <span style={styles.cardType}>{card.type}</span>
              </div>
            </div>
          ))}
        </div>
        {filtered.length > 200 && (
          <p style={styles.truncated}>
            Showing 200 of {filtered.length} results. Narrow your search to see
            more.
          </p>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "2rem 1.5rem",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#e0e0e0",
    background: "#111",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    margin: 0,
    color: "#fff",
  },
  subtitle: {
    margin: "0.25rem 0 0",
    fontSize: "0.95rem",
    color: "#888",
  },
  link: {
    color: "#7cacf8",
    textDecoration: "none",
  },

  // Docs
  docs: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "1.25rem 1.5rem",
    marginBottom: "1.5rem",
  },
  docsTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    margin: "0 0 0.5rem",
    color: "#fff",
  },
  docsText: {
    fontSize: "0.9rem",
    color: "#aaa",
    margin: "0.5rem 0",
    lineHeight: 1.5,
  },
  codeBlockWrap: {
    overflowX: "auto" as const,
  },
  codeBlock: {
    background: "#0d0d0d",
    border: "1px solid #333",
    borderRadius: 6,
    padding: "0.75rem 1rem",
    fontSize: "0.8rem",
    lineHeight: 1.6,
    color: "#c8d6e5",
    margin: "0.5rem 0",
    overflowX: "auto" as const,
  },
  exampleRow: {
    display: "flex",
    gap: "1rem",
    margin: "0.75rem 0",
    flexWrap: "wrap" as const,
  },
  exampleCard: {
    textAlign: "center" as const,
  },
  exampleImg: {
    height: 140,
    borderRadius: 4,
    display: "block",
    marginBottom: 4,
  },
  exampleCode: {
    fontSize: "0.7rem",
    color: "#888",
    display: "block",
  },
  exampleLabel: {
    color: "#7cacf8",
    fontWeight: 600,
  },

  // Blur demo
  inlineCode: {
    background: "#0d0d0d",
    border: "1px solid #333",
    borderRadius: 3,
    padding: "0.1rem 0.35rem",
    fontSize: "0.8rem",
    color: "#c8d6e5",
  },
  blurDemo: {
    margin: "0.75rem 0",
  },
  blurDemoCards: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
  },
  blurWrap: {
    position: "relative" as const,
    width: 140,
    aspectRatio: "5 / 7",
    borderRadius: 4,
    overflow: "hidden",
    background: "#222",
  },
  blurImg: {
    position: "absolute" as const,
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    filter: undefined as string | undefined,
    transition: "opacity 0.4s ease",
  },
  replayBtn: {
    marginTop: "0.5rem",
    padding: "0.3rem 0.75rem",
    fontSize: "0.8rem",
    border: "1px solid #333",
    borderRadius: 4,
    background: "#1a1a1a",
    color: "#888",
    cursor: "pointer",
  },

  // Controls
  controls: {
    marginBottom: "1rem",
  },
  searchInput: {
    width: "100%",
    padding: "0.6rem 0.75rem",
    fontSize: "0.95rem",
    border: "1px solid #333",
    borderRadius: 6,
    background: "#1a1a1a",
    color: "#e0e0e0",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  filters: {
    display: "flex",
    gap: "0.4rem",
    marginTop: "0.5rem",
    flexWrap: "wrap" as const,
  },
  filterBtn: {
    padding: "0.3rem 0.65rem",
    fontSize: "0.8rem",
    border: "1px solid #333",
    borderRadius: 4,
    background: "#1a1a1a",
    color: "#888",
    cursor: "pointer",
    textTransform: "capitalize" as const,
  },
  filterBtnActive: {
    background: "#2a3a5c",
    borderColor: "#4a6a9f",
    color: "#7cacf8",
  },
  count: {
    fontSize: "0.8rem",
    color: "#666",
    marginTop: "0.4rem",
  },

  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "0.75rem",
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 6,
    overflow: "hidden",
    transition: "border-color 0.15s",
  },
  cardImg: {
    width: "100%",
    aspectRatio: "5 / 7",
    objectFit: "cover" as const,
    display: "block",
    background: "#222",
  },
  cardInfo: {
    padding: "0.4rem 0.5rem",
  },
  cardName: {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#ddd",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardSlug: {
    display: "block",
    fontSize: "0.68rem",
    color: "#7cacf8",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    margin: "2px 0",
  },
  cardType: {
    display: "inline-block",
    fontSize: "0.65rem",
    color: "#666",
    textTransform: "capitalize" as const,
  },
  truncated: {
    textAlign: "center" as const,
    color: "#666",
    fontSize: "0.85rem",
    padding: "1rem 0",
  },
};
