import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageMetadata {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonical?: string;
  author: string;
  robots?: string;
}

const defaultMetadata: PageMetadata = {
  title: 'Enzonic LLC - Proving Things Can Be Done Different',
  description: 'Enzonic prioritizes users over company gains with eco-friendly solutions. Proving things can be done different.',
  keywords: 'enzonic, eco-friendly, user-centric, innovation, sustainable, technology, ai, discord bot, translation, virtual machines',
  ogTitle: 'Enzonic LLC - User-Centric & Eco-Friendly Solutions',
  ogDescription: 'Proving things can be done different. Prioritizing users over company gains with eco-friendly innovation.',
  ogImage: '/logo.png',
  twitterTitle: 'Enzonic LLC - User-Centric & Eco-Friendly Solutions',
  twitterDescription: 'Proving things can be done different. Prioritizing users over company gains with eco-friendly innovation.',
  twitterImage: '/logo.png',
  author: 'Enzonic LLC',
  robots: 'index, follow'
};

const pageMetadata: Record<string, PageMetadata> = {
  '/': {
    ...defaultMetadata,
    title: 'Enzonic LLC - Proving Things Can Be Done Different',
    description: 'Enzonic prioritizes users over company gains with eco-friendly solutions. Innovative AI services, Discord bots, virtual machines, and translation tools.',
    keywords: 'enzonic, llc, eco-friendly, user-centric, innovation, sustainable, ai services, discord bot, virtual machines, translation, emi, boxes',
    ogTitle: 'Enzonic LLC - User-Centric & Eco-Friendly Solutions',
    ogDescription: 'Innovative company providing AI services, Discord bots, virtual machines, and translation tools while prioritizing users over profits.',
    twitterTitle: 'Enzonic LLC - User-Centric & Eco-Friendly Solutions',
    twitterDescription: 'Innovative company providing AI services, Discord bots, virtual machines, and translation tools while prioritizing users over profits.'
  },
  '/admin': {
    ...defaultMetadata,
    title: 'Admin Dashboard - Enzonic LLC',
    description: 'Admin dashboard for managing Enzonic services, monitoring system health, and configuring platform settings.',
    keywords: 'enzonic, admin, dashboard, management, system health, configuration, monitoring',
    ogTitle: 'Admin Dashboard - Enzonic LLC',
    ogDescription: 'Comprehensive admin dashboard for managing Enzonic services and monitoring system health.',
    twitterTitle: 'Admin Dashboard - Enzonic LLC',
    twitterDescription: 'Comprehensive admin dashboard for managing Enzonic services and monitoring system health.',
    robots: 'noindex, nofollow'
  },
  '/support': {
    ...defaultMetadata,
    title: 'Support Center - Enzonic LLC',
    description: 'Get help and support for all Enzonic services. Submit support tickets and get assistance from our team within 24 hours.',
    keywords: 'enzonic, support, help, customer service, tickets, assistance, troubleshooting',
    ogTitle: 'Support Center - Enzonic LLC',
    ogDescription: 'Get help and support for all Enzonic services. Submit support tickets and get assistance from our team.',
    twitterTitle: 'Support Center - Enzonic LLC',
    twitterDescription: 'Get help and support for all Enzonic services. Submit support tickets and get assistance from our team.'
  },
  '/translate': {
    ...defaultMetadata,
    title: 'Enzonic Translate - AI-Powered Translation Service',
    description: 'Professional AI-powered translation service supporting 12+ languages including English, Spanish, French, German, Japanese, Chinese, and more. Break language barriers with accurate, context-aware translations. Free to use with optional account for translation history.',
    keywords: 'enzonic, translate, translation, ai translation, language translation, multilingual, openai, languages, professional translation, free translation',
    ogTitle: 'Enzonic Translate - AI-Powered Translation Service',
    ogDescription: 'Professional AI-powered translation service supporting 12+ languages with accurate, context-aware translations.',
    twitterTitle: 'Enzonic Translate - AI-Powered Translation Service',
    twitterDescription: 'Professional AI-powered translation service supporting 12+ languages with accurate, context-aware translations.'
  },
  '/boxes': {
    ...defaultMetadata,
    title: 'Enzonic Boxes - Secure Virtual Machine Browser Sessions',
    description: 'Access secure, isolated virtual browser sessions powered by Kasm. Cloud-based VMs with complete system isolation, auto-delete sessions, and no local resources required. Beta service for desktop users.',
    keywords: 'enzonic, boxes, virtual machine, browser sessions, kasm, isolated browsing, secure browsing, cloud vm, virtual desktop, sandbox browser',
    ogTitle: 'Enzonic Boxes - Secure Virtual Machine Browser Sessions',
    ogDescription: 'Secure, isolated browser sessions in the cloud. Complete system isolation with auto-delete functionality.',
    twitterTitle: 'Enzonic Boxes - Secure Virtual Machine Browser Sessions',
    twitterDescription: 'Secure, isolated browser sessions in the cloud. Complete system isolation with auto-delete functionality.'
  },
  '/emi': {
    ...defaultMetadata,
    title: 'Enzonic Emi - Advanced AI Discord Bot with Memory',
    description: 'Meet Emi, an 18-year-old AI from Japan. Advanced Discord bot with AI-powered memory, intelligent message handling, time awareness, custom system prompts, and OpenAI compatibility. Open source and self-hostable.',
    keywords: 'enzonic, emi, discord bot, ai bot, memory bot, intelligent bot, openai, discord, ai assistant, open source bot, japanese ai, custom prompts',
    ogTitle: 'Enzonic Emi - Advanced AI Discord Bot with Memory',
    ogDescription: 'Meet Emi, an 18-year-old AI from Japan. Advanced Discord bot with AI-powered memory and intelligent responses.',
    twitterTitle: 'Enzonic Emi - Advanced AI Discord Bot with Memory',
    twitterDescription: 'Meet Emi, an 18-year-old AI from Japan. Advanced Discord bot with AI-powered memory and intelligent responses.'
  },
  '/shows': {
    ...defaultMetadata,
    title: 'Enzonic Shows - Entertainment That Educates',
    description: 'Content that is simply different from other corporate companies. Entertainment recorded in Minecraft featuring funny videos, podcasts, stories, infographics, and educational content that proves entertainment can be done differently. Coming soon to YouTube.',
    keywords: 'enzonic, shows, entertainment, education, minecraft, comedy, infographics, educational content, video content, podcasts, stories, youtube',
    ogTitle: 'Enzonic Shows - Entertainment That Educates',
    ogDescription: 'Entertainment recorded in Minecraft with funny videos, infographics, and educational content. Coming soon.',
    twitterTitle: 'Enzonic Shows - Entertainment That Educates',
    twitterDescription: 'Entertainment recorded in Minecraft with funny videos, infographics, and educational content. Coming soon.'
  },
  '/terms': {
    ...defaultMetadata,
    title: 'Terms of Service - Enzonic LLC',
    description: 'Terms of Service for Enzonic LLC services. Read our user agreement, service terms, and conditions for using our platform.',
    keywords: 'enzonic, terms of service, user agreement, legal terms, service conditions, policy',
    ogTitle: 'Terms of Service - Enzonic LLC',
    ogDescription: 'Terms of Service for Enzonic LLC services and platform usage.',
    twitterTitle: 'Terms of Service - Enzonic LLC',
    twitterDescription: 'Terms of Service for Enzonic LLC services and platform usage.',
    robots: 'index, nofollow'
  },
  '/privacy': {
    ...defaultMetadata,
    title: 'Privacy Policy - Enzonic LLC',
    description: 'Privacy Policy for Enzonic LLC. Learn how we collect, use, and protect your personal information in compliance with GDPR and CCPA.',
    keywords: 'enzonic, privacy policy, data protection, gdpr, ccpa, personal information, privacy',
    ogTitle: 'Privacy Policy - Enzonic LLC',
    ogDescription: 'Privacy Policy for Enzonic LLC detailing how we protect your personal information.',
    twitterTitle: 'Privacy Policy - Enzonic LLC',
    twitterDescription: 'Privacy Policy for Enzonic LLC detailing how we protect your personal information.',
    robots: 'index, nofollow'
  }
};

export const usePageMetadata = () => {
  const location = useLocation();

  const updateMetaTag = (selector: string, attribute: string, content: string) => {
    let element = document.querySelector(selector) as HTMLMetaElement;
    if (element) {
      element.setAttribute(attribute, content);
    } else {
      element = document.createElement('meta');
      if (selector.includes('property=')) {
        const property = selector.match(/property="([^"]+)"/)?.[1];
        if (property) element.setAttribute('property', property);
      } else if (selector.includes('name=')) {
        const name = selector.match(/name="([^"]+)"/)?.[1];
        if (name) element.setAttribute('name', name);
      }
      element.setAttribute('content', content);
      document.head.appendChild(element);
    }
  };

  const updateLinkTag = (rel: string, href: string, type?: string) => {
    let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
    if (element) {
      element.href = href;
      if (type) element.type = type;
    } else {
      element = document.createElement('link');
      element.rel = rel;
      element.href = href;
      if (type) element.type = type;
      document.head.appendChild(element);
    }
  };

  useEffect(() => {
    const metadata = pageMetadata[location.pathname] || defaultMetadata;
    const currentUrl = window.location.origin + location.pathname;

    // Update document title
    document.title = metadata.title;

    // Update favicon to always use logo.png
    updateLinkTag('icon', '/logo.png', 'image/png');

    // Update basic meta tags
    updateMetaTag('meta[name="description"]', 'content', metadata.description);
    updateMetaTag('meta[name="keywords"]', 'content', metadata.keywords);
    updateMetaTag('meta[name="author"]', 'content', metadata.author);
    
    if (metadata.robots) {
      updateMetaTag('meta[name="robots"]', 'content', metadata.robots);
    }

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', 'content', metadata.ogTitle);
    updateMetaTag('meta[property="og:description"]', 'content', metadata.ogDescription);
    updateMetaTag('meta[property="og:type"]', 'content', 'website');
    updateMetaTag('meta[property="og:url"]', 'content', currentUrl);
    updateMetaTag('meta[property="og:image"]', 'content', window.location.origin + metadata.ogImage);
    updateMetaTag('meta[property="og:site_name"]', 'content', 'Enzonic LLC');

    // Update Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'content', metadata.twitterTitle);
    updateMetaTag('meta[name="twitter:description"]', 'content', metadata.twitterDescription);
    updateMetaTag('meta[name="twitter:image"]', 'content', window.location.origin + metadata.twitterImage);

    // Update canonical URL
    const canonicalUrl = metadata.canonical || currentUrl;
    updateLinkTag('canonical', canonicalUrl);

    // Add structured data
    let structuredData: any = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Enzonic LLC",
      "url": window.location.origin,
      "logo": window.location.origin + "/logo.png",
      "description": metadata.description,
      "sameAs": []
    };

    // Add page-specific structured data
    if (location.pathname === '/') {
      structuredData = {
        ...structuredData,
        "@type": "Organization",
        "offers": [
          {
            "@type": "Service",
            "name": "Enzonic Translate",
            "description": "AI-powered translation service"
          },
          {
            "@type": "Service", 
            "name": "Enzonic Boxes",
            "description": "Secure virtual machine browser sessions"
          },
          {
            "@type": "Service",
            "name": "Enzonic Emi",
            "description": "Advanced AI Discord bot"
          }
        ]
      };
    } else if (location.pathname === '/translate') {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Enzonic Translate",
        "description": metadata.description,
        "url": currentUrl,
        "applicationCategory": "Translation",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      };
    } else if (location.pathname === '/emi') {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Enzonic Emi",
        "description": metadata.description,
        "url": currentUrl,
        "applicationCategory": "Discord Bot",
        "operatingSystem": "Discord",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      };
    } else if (location.pathname === '/boxes') {
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Enzonic Boxes",
        "description": metadata.description,
        "url": currentUrl,
        "applicationCategory": "Virtual Machine",
        "operatingSystem": "Web Browser"
      };
    }

    let scriptElement = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (scriptElement) {
      scriptElement.textContent = JSON.stringify(structuredData);
    } else {
      scriptElement = document.createElement('script');
      scriptElement.type = 'application/ld+json';
      scriptElement.textContent = JSON.stringify(structuredData);
      document.head.appendChild(scriptElement);
    }

  }, [location.pathname]);
};