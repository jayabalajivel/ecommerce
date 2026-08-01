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
  name = 'MaduraiMadasamyIdlypodi',
  type = 'website',
  image = 'https://maduraimadasamyidlipodi.com/logo.jpg',
  url = '',
  keywords = 'idlipodi, idlypodi, idli podi, idly podi, MaduraiMadasamyIdlypodi, Madurai Madasamy Idly Podi, Madurai Idly Podi, Best Idly Podi in India, Homemade Idly Podi, Madurai Madasamy Idlipodi, buy idli podi online, garlic idly podi, ellu podi, paruppu podi, karuveppilai podi, authentic south indian spices, Tamil Nadu idli podi, chutney powder, milagai podi',
  schema,
}: SEOProps) {
  // Always use the custom domain as the canonical URL base to avoid indexing Vercel deployment URLs
  const canonicalUrl = url || `https://maduraimadasamyidlipodi.com${window.location.pathname}`;

  // Default structured data schema for Organization and WebSite
  const defaultSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://maduraimadasamyidlipodi.com/#organization',
      'name': 'MaduraiMadasamyIdlypodi',
      'alternateName': ['Madurai Madasamy Idly Podi', 'Madurai Madasamy Idlypodi', 'Madurai Madasamy Idlipodi', 'maduraimadasamyidlipodi'],
      'url': 'https://maduraimadasamyidlipodi.com',
      'logo': 'https://maduraimadasamyidlipodi.com/logo.jpg'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': 'https://maduraimadasamyidlipodi.com/#website',
      'name': 'MaduraiMadasamyIdlypodi',
      'alternateName': ['Madurai Madasamy Idly Podi', 'Madurai Madasamy Idlypodi', 'Madurai Madasamy Idlipodi', 'maduraimadasamyidlipodi'],
      'url': 'https://maduraimadasamyidlipodi.com',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': 'https://maduraimadasamyidlipodi.com/category/all?search={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    }
  ];

  const jsonLdSchema = schema || defaultSchema;

  const pageTitle = title.includes('MaduraiMadasamyIdlypodi') ? title : `${title} | ${name}`;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords} />
      <meta name='robots' content='index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Facebook tags */}
      <meta property='og:type' content={type} />
      <meta property='og:title' content={pageTitle} />
      <meta property='og:description' content={description} />
      <meta property='og:site_name' content="MaduraiMadasamyIdlypodi" />
      {image && <meta property='og:image' content={image} />}
      <meta property='og:url' content={canonicalUrl} />
      
      {/* Twitter tags */}
      <meta name='twitter:creator' content={name} />
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={pageTitle} />
      <meta name='twitter:description' content={description} />
      {image && <meta name='twitter:image' content={image} />}

      {/* Structured Schema Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLdSchema)}
      </script>
    </Helmet>
  );
}


