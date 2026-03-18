import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  robots?: string;
}

const baseUrl = "https://taskhive.pages.dev";

export default function SEO({
  title,
  description,
  path = "/",
  robots = "index, follow",
}: SEOProps) {
  const canonicalUrl = new URL(path, baseUrl).toString();

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
    </Helmet>
  );
}
