import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMetadata } from "@/hooks/use-page-metadata";

const Privacy = () => {
  usePageMetadata();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            
            <p className="text-muted-foreground text-lg mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  Enzonic LLC ("we", "our", "us") collects information that you provide directly to us, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Name and contact information (email address, phone number)</li>
                  <li>Account credentials and profile information</li>
                  <li>Support ticket submissions and communications</li>
                  <li>Newsletter subscription preferences</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Send newsletters and marketing communications (with your consent)</li>
                  <li>Protect against fraudulent or illegal activity</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">3. Data Protection and Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal 
                  information against unauthorized access, alteration, disclosure, or destruction. We comply 
                  with applicable data protection laws, including GDPR and CCPA requirements.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell your personal information. We may share your information only in the 
                  following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>With your consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and prevent fraud</li>
                  <li>With service providers who assist in our operations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to enhance your experience on our website. 
                  You can control cookie preferences through your browser settings.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our services are not directed to individuals under the age of 18. We do not knowingly 
                  collect personal information from children.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new policy on this page with an updated "Last updated" date.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy, please contact us at{" "}
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

export default Privacy;
