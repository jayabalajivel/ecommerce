import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  name?: string;
  type?: string;
  image?: string;
  url?: string;
  keywords?: string;
  schema?: Record<string, any>;
}

export function SEO({
  title,
  description,
  name = 'Madurai Madasamy Idlypodi',
  type = 'website',
  image = 'https://maduraimadasamyidlipodi.com/logo.jpg',
  url = '',
  keywords = 'idlipodi, idlypodi, podi, madurai madasamy idlypodi, madurai madasamy idlipodi, buy idli podi online, best idly podi, garlic idly podi, ellu podi, paruppu podi, karuveppilai podi, authentic south indian spices, homemade podi, traditional tamil nadu idli podi, thokku online',
  schema,
}: SEOProps) {
  // Always use the custom domain as the canonical URL base to avoid indexing Vercel deployment URLs
  const canonicalUrl = url || `https://maduraimadasamyidlipodi.com${window.location.pathname}`;

  // Default structured data schema for the website search & organization snippet
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': name,
    'url': 'https://maduraimadasamyidlipodi.com',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://maduraimadasamyidlipodi.com/category/all?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const jsonLdSchema = schema || defaultSchema;

  return (
    <Helmet>
      <title>{`${title} | ${name}`}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Facebook tags */}
      <meta property='og:type' content={type} />
      <meta property='og:title' content={title} />
      <meta property='og:description' content={description} />
      {image && <meta property='og:image' content={image} />}
      <meta property='og:url' content={canonicalUrl} />
      
      {/* Twitter tags */}
      <meta name='twitter:creator' content={name} />
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
      {image && <meta name='twitter:image' content={image} />}

      {/* Structured Schema Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLdSchema)}
      </script>
    </Helmet>
  );
}


