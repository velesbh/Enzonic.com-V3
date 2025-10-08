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
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Name and contact information (email address, phone number)</li>
                  <li>Account credentials and profile information</li>
                  <li>Support ticket submissions and communications</li>
                  <li>Newsletter subscription preferences</li>
                  <li>AI interaction data (prompts, inputs, and conversation history)</li>
                  <li>Usage analytics and service interaction logs</li>
                  <li>Device information and technical data (IP address, browser type, operating system)</li>
                </ul>
                <p className="text-muted-foreground">
                  <strong>AI Services Data:</strong> When you use our AI services (chatbots, translation tools, content generation, Discord bots), 
                  we collect and process your inputs, queries, and generated outputs to provide the service. This data is 
                  used only for service delivery and anonymized statistics - we do not train AI models on your personal data, 
                  except G-Coder which may use coding-related inputs to improve programming assistance.
                </p>
                <p className="text-muted-foreground">
                  <strong>Virtual Browser Sessions:</strong> When using our Boxes service (virtual browser sessions), we collect 
                  session metadata and usage statistics. All session data is automatically deleted upon session termination 
                  for security and privacy protection.
                </p>
                <p className="text-muted-foreground">
                  <strong>Discord Bot Data:</strong> Our Emi Discord bot processes messages, server information, and user interactions 
                  within Discord servers where it's installed. This includes conversation history for context and memory features. 
                  Bot data is processed in accordance with Discord's Terms of Service and our data retention policies.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Provide, maintain, and improve our services, including AI functionalities</li>
                  <li>Process and respond to your AI queries and requests</li>
                  <li>Personalize your experience and improve AI model performance</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Send newsletters and marketing communications (with your consent)</li>
                  <li>Protect against fraudulent or illegal activity</li>
                  <li>Comply with legal obligations and enforce our terms</li>
                  <li>Conduct research and development to enhance AI capabilities</li>
                </ul>
                <p className="text-muted-foreground">
                  <strong>AI Model Training:</strong> We do NOT use your personal conversations or identifiable data to train AI models. 
                  The only exception is G-Coder, which may use coding-related inputs to improve programming assistance. 
                  All other data is used solely for service delivery and anonymized statistics.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">3. Legal Basis for Processing (GDPR)</h2>
                <p className="text-muted-foreground mb-4">
                  For users in the European Economic Area (EEA), we process your personal data based on the following legal grounds:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Contract Performance:</strong> To provide AI services and fulfill our contractual obligations</li>
                  <li><strong>Legitimate Interests:</strong> To improve our services, prevent fraud, and ensure security</li>
                  <li><strong>Consent:</strong> For marketing communications and optional data processing activities</li>
                  <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">4. Data Retention</h2>
                <p className="text-muted-foreground mb-4">
                  We retain your personal information for different periods depending on the type of data:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Account Data:</strong> Retained while your account is active and for up to 2 years after closure</li>
                  <li><strong>AI Conversation Data:</strong> Stored for up to 30 days for service delivery, then anonymized or deleted</li>
                  <li><strong>Support Communications:</strong> Retained for up to 3 years for customer service purposes</li>
                  <li><strong>Marketing Data:</strong> Retained until you withdraw consent or for up to 2 years of inactivity</li>
                  <li><strong>Legal/Compliance Data:</strong> Retained as required by applicable laws</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">5. Data Protection and Security</h2>
                <p className="text-muted-foreground mb-4">
                  We implement appropriate technical and organizational measures to protect your personal 
                  information against unauthorized access, alteration, disclosure, or destruction, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Access controls and authentication mechanisms</li>
                  <li>Regular security assessments and monitoring</li>
                  <li>Secure AI processing environments with data isolation</li>
                  <li>Employee training on data protection and privacy</li>
                </ul>
                <p className="text-muted-foreground">
                  We comply with applicable data protection laws, including GDPR and CCPA requirements. 
                  However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">6. International Data Transfers</h2>
                <p className="text-muted-foreground">
                  Your data may be transferred to and processed in countries outside your jurisdiction, including the United States. 
                  For EEA users, we ensure adequate protection through Standard Contractual Clauses (SCCs) or other approved mechanisms. 
                  We take steps to ensure your data receives an adequate level of protection wherever it is processed.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">7. Information Sharing and Third-Party Services</h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell your personal information. We may share your information only in the 
                  following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations, court orders, or government requests</li>
                  <li>To protect our rights, property, or safety, or that of others</li>
                  <li>With service providers who assist in our operations (under strict data processing agreements)</li>
                  <li>In connection with a business transaction (merger, acquisition, or sale)</li>
                </ul>
                <p className="text-muted-foreground">
                  We retain and protect your data - we only use aggregated, anonymized data for statistics and service improvement.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">8. Your Rights and Choices</h2>
                <p className="text-muted-foreground mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><strong>Access:</strong> Request copies of your personal information</li>
                  <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
                  <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                  <li><strong>Restriction:</strong> Limit the processing of your data</li>
                  <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent for consent-based processing</li>
                  <li><strong>Opt-out:</strong> Opt-out of sale/sharing of personal information (CCPA)</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  <strong>AI-Specific Rights:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Request deletion of your AI conversation history</li>
                  <li>For G-Coder: Opt-out of using your coding inputs for model improvement</li>
                  <li>Request information about AI decision-making processes affecting you</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking Technologies</h2>
                <p className="text-muted-foreground mb-4">
                  We use cookies and similar tracking technologies to enhance your experience on our website:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><strong>Essential Cookies:</strong> Required for basic website functionality</li>
                  <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our site</li>
                  <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                  <li><strong>Targeting Cookies:</strong> Used for personalized advertising (with consent)</li>
                </ul>
                <p className="text-muted-foreground">
                  You can control cookie preferences through your browser settings or our cookie consent manager. 
                  Note that disabling certain cookies may affect website functionality.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">10. California Privacy Rights (CCPA)</h2>
                <p className="text-muted-foreground mb-4">
                  California residents have additional rights under the California Consumer Privacy Act (CCPA):
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Right to know what personal information is collected and how it's used</li>
                  <li>Right to delete personal information</li>
                  <li>Right to opt-out of the sale of personal information</li>
                  <li>Right to non-discrimination for exercising privacy rights</li>
                  <li>Right to correct inaccurate personal information</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our services are not directed to individuals under the age of 18. We do not knowingly 
                  collect personal information from children under 18. If we become aware that we have 
                  collected personal information from a child under 18, we will take steps to delete such information.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time to reflect changes in our practices, 
                  technology, legal requirements, or other factors. We will notify you of any material changes 
                  by posting the new policy on this page with an updated "Last updated" date. For significant 
                  changes, we may provide additional notice through email or our services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
                </p>
                <ul className="list-none space-y-2 text-muted-foreground">
                  <li><strong>Email:</strong> <a href="mailto:admin@enzonic.com" className="text-primary hover:underline">admin@enzonic.com</a></li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>For EEA residents:</strong> You also have the right to lodge a complaint with your local supervisory authority 
                  if you believe we have not addressed your concerns adequately.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">14. Automated Decision-Making</h2>
                <p className="text-muted-foreground">
                  We may use automated decision-making, including AI systems, to provide personalized services 
                  and recommendations. You have the right to request human intervention, express your point of view, 
                  and contest automated decisions that significantly affect you. Our AI systems are designed with 
                  appropriate safeguards to prevent discriminatory outcomes.
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
