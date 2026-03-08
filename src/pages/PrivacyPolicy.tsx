import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navigation />

      <main className="container mx-auto px-4 pt-32 pb-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-10 text-gray-800"
        >
          Privacy Policy
        </motion.h1>

        <Card className="shadow-lg border border-gray-200">
          <CardContent className="space-y-6 text-gray-700 leading-relaxed pt-6">

            <p>
              At <strong>Malani Barmer</strong>, we value your privacy and are
              committed to protecting your personal information. This Privacy
              Policy explains how we collect, use, and safeguard your data when
              you visit our website.
            </p>

            <h2 className="text-xl font-semibold">Information We Collect</h2>
            <p>
              When you interact with our website or contact us, we may collect
              basic information such as your name, phone number, email address,
              and any message you submit through the contact form.
            </p>

            <h2 className="text-xl font-semibold">How We Use Your Information</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>To respond to customer inquiries</li>
              <li>To provide our services</li>
              <li>To improve our website and user experience</li>
              <li>To communicate important service updates</li>
            </ul>

            <h2 className="text-xl font-semibold">Google AdSense</h2>
            <p>
              Our website may display advertisements through Google AdSense.
              Google may use cookies to show relevant ads based on your browsing
              history and interests.
            </p>

            <h2 className="text-xl font-semibold">Third-Party Services</h2>
            <p>
              We may use trusted third-party services such as Google Maps,
              analytics tools, and communication platforms to improve our
              services.
            </p>

            <h2 className="text-xl font-semibold">Your Privacy Rights</h2>
            <p>
              You have the right to request access to or deletion of your
              personal data collected through this website.
            </p>

            <h2 className="text-xl font-semibold">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact
              us at:
            </p>

            <p className="font-medium">
              📍 Near IDBI Bank, Barmer, Rajasthan <br />
              📞 +91 9950788973
            </p>

          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;