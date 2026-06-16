import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
}

export function useSEO({ title, description, canonicalUrl }: SEOProps) {
  useEffect(() => {
    const originalTitle = document.title;
    
    // Update Title
    if (title) {
      document.title = `${title} | AuraLuxe`;
    }

    // Update Description
    let metaDescription = document.querySelector('meta[name="description"]');
    let originalDescription = '';
    
    if (description) {
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      } else {
        originalDescription = metaDescription.getAttribute('content') || '';
      }
      metaDescription.setAttribute('content', description);
    }

    // Update Canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    let originalCanonicalUrl = '';
    
    if (canonicalUrl) {
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      } else {
        originalCanonicalUrl = linkCanonical.getAttribute('href') || '';
      }
      linkCanonical.setAttribute('href', canonicalUrl);
    }

    return () => {
      // Restore previous title and meta tags when unmounted
      if (title) {
        document.title = originalTitle;
      }
      if (description && metaDescription) {
        if (originalDescription) {
          metaDescription.setAttribute('content', originalDescription);
        } else {
          document.head.removeChild(metaDescription);
        }
      }
      if (canonicalUrl && linkCanonical) {
        if (originalCanonicalUrl) {
          linkCanonical.setAttribute('href', originalCanonicalUrl);
        } else {
          document.head.removeChild(linkCanonical);
        }
      }
    };
  }, [title, description, canonicalUrl]);
}
