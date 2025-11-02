export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-lg">
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect information you provide directly, including your name, email, and
            responses to personality assessments. We also collect usage data and analytics.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide and improve our personality assessment services</li>
            <li>Generate your personalized results and insights</li>
            <li>Send you updates and relevant content</li>
            <li>Analyze trends and improve our platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">3. Data Security</h2>
          <p className="mb-4">
            We implement industry-standard security measures to protect your data. Your
            assessment responses are encrypted and stored securely.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">4. Data Sharing</h2>
          <p className="mb-4">
            We do not sell your personal information. We may share anonymized data for
            research purposes only with your consent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. Your Rights</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal data</li>
            <li>Request data correction or deletion</li>
            <li>Opt-out of marketing communications</li>
            <li>Download your assessment results</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">6. Cookies</h2>
          <p className="mb-4">
            We use cookies to enhance your experience and analyze platform usage. You can
            disable cookies in your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">7. Children's Privacy</h2>
          <p className="mb-4">
            Our services are not intended for users under 18. We do not knowingly collect
            data from children.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">8. Updates to This Policy</h2>
          <p className="mb-4">
            We may update this privacy policy periodically. We will notify you of significant
            changes via email.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
          <p className="mb-4">
            For privacy-related questions, contact us at privacy@saintara.com
          </p>
        </section>
      </div>
    </div>
  )
}
