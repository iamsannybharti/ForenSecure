import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  schemaType?: 'WebSite' | 'Organization' | 'Course' | 'Article' | 'FAQ' | 'BreadcrumbList' | 'Service';
  schemaData?: any;
  keywords?: string[];
}

export default function SEO({
  title,
  description,
  canonicalPath = '',
  schemaType,
  schemaData,
  keywords = []
}: SEOProps) {
  useEffect(() => {
    // Update Title
    const formattedTitle = `${title} | ForenSecure - Built for India's Forensic Future`;
    document.title = formattedTitle;

    // Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Update Meta Keywords
    const defaultKeywords = [
      'Digital Forensics', 'Cyber Forensics', 'Forensic Science', 
      'Crime Scene Investigation', 'Fingerprint Analysis', 'DNA Analysis',
      'Cyber Crime Investigation', 'Forensic Courses India', 'NFSU Preparation'
    ];
    const combinedKeywords = Array.from(new Set([...defaultKeywords, ...keywords])).join(', ');
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', combinedKeywords);

    // Update Canonical Link
    const siteUrl = 'https://forensecure.edu.in';
    const fullUrl = `${siteUrl}${canonicalPath}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullUrl);

    // OpenGraph & Twitter Cards
    const ogTags = [
      { property: 'og:title', content: formattedTitle },
      { property: 'og:description', content: description },
      { property: 'og:type', content: schemaType === 'Article' ? 'article' : 'website' },
      { property: 'og:url', content: fullUrl },
      { property: 'og:image', content: `${siteUrl}/assets/og-image.png` },
      { property: 'og:site_name', content: 'ForenSecure' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: formattedTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: `${siteUrl}/assets/og-image.png` }
    ];

    ogTags.forEach(tag => {
      const selector = tag.property 
        ? `meta[property="${tag.property}"]` 
        : `meta[name="${tag.name}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (tag.property) el.setAttribute('property', tag.property);
        if (tag.name) el.setAttribute('name', tag.name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', tag.content);
    });

    // Handle Schema Markups (JSON-LD)
    const existingSchemaScript = document.getElementById('jsonld-schema-script');
    if (existingSchemaScript) {
      existingSchemaScript.remove();
    }

    const schemas: any[] = [];

    // Always output basic Website and Org Schema
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'ForenSecure',
      'url': siteUrl,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${siteUrl}/courses?search={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      'name': 'ForenSecure Forensic Learning Ecosystem',
      'url': siteUrl,
      'logo': `${siteUrl}/company-logo.png`,
      'sameAs': [
        'https://linkedin.com/company/forensecure',
        'https://twitter.com/forensecure'
      ],
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'New Delhi',
        'addressCountry': 'IN'
      }
    });

    // Custom Schemas if provided
    if (schemaType && schemaData) {
      if (schemaType === 'Course') {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'Course',
          'name': schemaData.name,
          'description': schemaData.description,
          'provider': {
            '@type': 'EducationalOrganization',
            'name': 'ForenSecure',
            'sameAs': siteUrl
          },
          'hasCourseInstance': {
            '@type': 'CourseInstance',
            'courseMode': 'Online/Hybrid',
            'instructor': {
              '@type': 'Person',
              'name': schemaData.instructorName
            }
          }
        });
      } else if (schemaType === 'Article') {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          'headline': schemaData.headline,
          'image': schemaData.image || `${siteUrl}/assets/og-image.png`,
          'author': {
            '@type': 'Person',
            'name': schemaData.authorName
          },
          'publisher': {
            '@type': 'Organization',
            'name': 'ForenSecure',
            'logo': `${siteUrl}/company-logo.png`
          },
          'datePublished': schemaData.datePublished || new Date().toISOString()
        });
      } else if (schemaType === 'FAQ') {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': schemaData.faqs.map((faq: any) => ({
            '@type': 'Question',
            'name': faq.question,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': faq.answer
            }
          }))
        });
      }
    }

    const script = document.createElement('script');
    script.id = 'jsonld-schema-script';
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schemas);
    document.head.appendChild(script);

    return () => {
      // Cleanup schemas if page unmounts
      const scriptToClean = document.getElementById('jsonld-schema-script');
      if (scriptToClean) {
        scriptToClean.remove();
      }
    };
  }, [title, description, canonicalPath, schemaType, schemaData, keywords]);

  return null; // Side-effect only component
}
