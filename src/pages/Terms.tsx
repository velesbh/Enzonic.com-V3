import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMetadata } from "@/hooks/use-page-metadata";

const Terms = () => {
  usePageMetadata();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            
            <p className="text-muted-foreground text-lg mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using the services provided by Enzonic LLC ("Company", "we", "our"), 
                  you accept and agree to be bound by these Terms of Service. If you do not agree to 
                  these terms, please do not use our services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">2. Description of Services</h2>
                <p className="text-muted-foreground mb-4">
                  Enzonic LLC provides innovative, user-centric, and eco-friendly solutions, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><strong>Enzonic Search:</strong> Privacy-focused web search powered by SearXNG, featuring intelligent autocomplete, Wikipedia integration, search history, and category-based filtering (images, videos, news, etc.)</li>
                  <li><strong>AI Services:</strong> Chatbots, language translation, content generation, and AI-powered tools</li>
                  <li><strong>Emi Discord Bot:</strong> AI-powered Discord bot with memory and intelligent conversation capabilities</li>
                  <li><strong>Virtual Browser Sessions (Boxes):</strong> Secure, isolated virtual machine browser sessions powered by Kasm</li>
                  <li><strong>Entertainment Content (Shows):</strong> Educational and entertainment content services</li>
                  <li><strong>Translation Services:</strong> Multi-language AI translation tools</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  We reserve the right to modify, suspend, or discontinue any aspect of our services at any time without prior notice.
                </p>
                <p className="text-muted-foreground">
                  Our AI services are provided "as is" and are intended for general informational and 
                  assistance purposes only. AI-generated content should not be considered as professional 
                  advice and may contain inaccuracies or limitations. Virtual browser sessions are isolated 
                  environments with auto-delete functionality for security purposes.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">3. AI Services and Limitations</h2>
                <p className="text-muted-foreground mb-4">
                  When using our AI services, you acknowledge and agree that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>AI responses are generated automatically and may contain errors, inaccuracies, or inappropriate content</li>
                  <li>AI-generated content does not constitute professional advice (medical, legal, financial, etc.)</li>
                  <li>You should verify and validate AI-generated information before relying on it</li>
                  <li>We do not guarantee the accuracy, completeness, or reliability of AI outputs</li>
                  <li>AI services may have usage limitations, rate limits, or temporary unavailability</li>
                  <li>You are responsible for reviewing AI-generated content before use or publication</li>
                  <li>Our AI models are trained on diverse data sources and may reflect biases present in training data</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
                <p className="text-muted-foreground mb-4">
                  Users of our services agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of account credentials</li>
                  <li>Use services in compliance with applicable laws and regulations</li>
                  <li>Not engage in unauthorized access or misuse of services</li>
                  <li>Not use AI services to generate harmful, illegal, or inappropriate content</li>
                  <li>Not attempt to reverse-engineer, extract, or replicate our AI models</li>
                  <li>Not use our services to create competing AI products or services</li>
                  <li>Respect intellectual property rights and not infringe on third-party rights</li>
                  <li>Not use AI services for automated decision-making affecting individuals without proper safeguards</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">5. Content and Data Usage</h2>
                <p className="text-muted-foreground mb-4">
                  Regarding content and data usage:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>You retain ownership of content you input into our AI services</li>
                  <li>You grant us a limited license to process your inputs to provide AI services</li>
                  <li>We use your data only for providing services and anonymized statistics</li>
                  <li><strong>We do NOT train AI models on your personal data or conversations, except for G-Coder which may use coding-related inputs to improve programming assistance</strong></li>
                  <li>You are responsible for ensuring you have rights to any content you input</li>
                  <li>AI-generated outputs may not be eligible for copyright protection</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content and intellectual property on this website and in our services 
                  are owned by Enzonic LLC or our licensors. This includes our AI models, algorithms, 
                  and proprietary technologies. While we have not registered any trademarks, our brand names, 
                  logos, and service names are proprietary to Enzonic LLC. Unauthorized use, reproduction, 
                  or distribution is strictly prohibited.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">7. Disclaimer of Warranties and Limitation of Liability</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>DISCLAIMER:</strong> Our services, including AI services, are provided "AS IS" and "AS AVAILABLE" 
                  without warranties of any kind, either express or implied. We specifically disclaim all warranties 
                  regarding:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Accuracy, reliability, or completeness of AI-generated content</li>
                  <li>Fitness for a particular purpose or non-infringement</li>
                  <li>Uninterrupted or error-free operation of AI services</li>
                  <li>Security or privacy of data processed by AI systems</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  <strong>LIMITATION OF LIABILITY:</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, ENZONIC LLC SHALL NOT BE LIABLE FOR:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Any decisions made based on AI-generated content or recommendations</li>
                  <li>Inaccurate, harmful, or inappropriate AI outputs</li>
                  <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Any damages exceeding the amount paid for our services in the preceding 12 months</li>
                </ul>
                <p className="text-muted-foreground">
                  You acknowledge that AI technology has inherent limitations and agree to use our AI services 
                  at your own risk. Some jurisdictions do not allow the exclusion of certain warranties or 
                  limitation of liability, so these limitations may not apply to you.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">8. Indemnification</h2>
                <p className="text-muted-foreground">
                  You agree to indemnify, defend, and hold harmless Enzonic LLC and its officers, directors, 
                  employees, and agents from any claims, damages, losses, or expenses (including attorney's fees) 
                  arising from: (a) your use of our AI services; (b) your violation of these terms; 
                  (c) your violation of any third-party rights; or (d) any decisions made based on AI-generated content.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">9. Governing Law and Dispute Resolution</h2>
                <p className="text-muted-foreground">
                  These Terms of Service shall be governed by and construed in accordance with the laws 
                  of the Commonwealth of Kentucky, United States, without regard to its conflict of law 
                  provisions. Any disputes arising from these terms or your use of our services shall be 
                  resolved through binding arbitration in accordance with the American Arbitration Association's 
                  Commercial Arbitration Rules.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">10. Enzonic Search Service</h2>
                <p className="text-muted-foreground mb-4">
                  Our search service aggregates results from multiple search engines via SearXNG and provides instant answers. You acknowledge:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Search results are sourced from third-party search engines and may include Wikipedia content</li>
                  <li>We act as an intermediary and proxy requests through our backend to protect your privacy</li>
                  <li>Mock fallback results may be provided if search engines are temporarily unavailable</li>
                  <li>Search history is stored locally in your browser (localStorage) and can be cleared anytime</li>
                  <li>Search queries are not stored on our servers except for anonymized analytics</li>
                  <li>We exclude Wikipedia from general search results to provide a dedicated Wikipedia sidebar</li>
                  <li>Autocomplete suggestions are provided by third-party services (e.g., Google, DuckDuckGo)</li>
                  <li>Category filtering (images, videos, news) is provided best-effort and depends on upstream engines</li>
                  <li>We do not control or endorse third-party search result content</li>
                  <li>Search results may contain ads or sponsored content from upstream providers</li>
                  <li><strong>Instant Answer Tools:</strong> Calculator, time/date display, translator, unit converter, and currency converter are provided as-is</li>
                  <li><strong>Currency Converter:</strong> Exchange rates provided by FreeCurrencyAPI.com, cached for 1 hour, for informational purposes only</li>
                  <li>Currency conversion rates may not reflect real-time market rates and should not be used for financial decisions</li>
                  <li>Usage statistics for instant answers are stored locally for service improvement</li>
                </ul>
                <p className="text-muted-foreground">
                  You agree not to misuse the search service for automated scraping, excessive requests, 
                  or circumventing rate limits. We reserve the right to implement rate limiting or 
                  CAPTCHA protection if abuse is detected.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">11. Modifications and Termination</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. Changes will be effective immediately 
                  upon posting. We may terminate or suspend your access to our services at any time, with or 
                  without notice, for any reason, including violation of these terms.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms of Service, please contact us at{" "}
                  <a href="mailto:admin@enzonic.com" className="text-primary hover:underline">
                    admin@enzonic.com
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
