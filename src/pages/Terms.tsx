import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
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
                <p className="text-muted-foreground">
                  Enzonic LLC provides innovative, user-centric, and eco-friendly solutions. We reserve 
                  the right to modify, suspend, or discontinue any aspect of our services at any time 
                  without prior notice.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
                <p className="text-muted-foreground mb-4">
                  Users of our services agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of account credentials</li>
                  <li>Use services in compliance with applicable laws</li>
                  <li>Not engage in unauthorized access or misuse of services</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content, trademarks, and intellectual property on this website are owned by 
                  Enzonic LLC. Unauthorized use, reproduction, or distribution is strictly prohibited.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  Enzonic LLC shall not be liable for any indirect, incidental, special, or consequential 
                  damages arising from the use or inability to use our services, even if we have been 
                  advised of the possibility of such damages.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">6. Governing Law</h2>
                <p className="text-muted-foreground">
                  These Terms of Service shall be governed by and construed in accordance with the laws 
                  of the Commonwealth of Kentucky, United States, without regard to its conflict of law 
                  provisions.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
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
