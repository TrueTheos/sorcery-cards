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
