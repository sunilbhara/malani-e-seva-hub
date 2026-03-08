import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navigation />

      <main className="container mx-auto px-4 pt-32 pb-16">

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-10 text-gray-800"
        >
          Terms & Conditions
        </motion.h1>

        <Card className="shadow-lg border border-gray-200">
          <CardContent className="space-y-6 text-gray-700 leading-relaxed pt-6">

            <p>
              Welcome to <strong>Malani Barmer</strong>. By accessing this
              website, you agree to comply with and be bound by the following
              terms and conditions.
            </p>

            <h2 className="text-xl font-semibold">Use of Website</h2>
            <p>
              This website is intended to provide information about the services
              offered by Malani Barmer. Users must not misuse the website or use
              it for unlawful purposes.
            </p>

            <h2 className="text-xl font-semibold">Service Information</h2>
            <p>
              We strive to ensure that all service information on our website is
              accurate. However, service availability and pricing may change
              without prior notice.
            </p>

            <h2 className="text-xl font-semibold">Third-Party Links</h2>
            <p>
              Our website may contain links to third-party services such as
              Google Maps. We are not responsible for the content or policies of
              those websites.
            </p>

            <h2 className="text-xl font-semibold">Limitation of Liability</h2>
            <p>
              Malani Barmer will not be held liable for any damages arising from
              the use of this website or reliance on the information provided.
            </p>

            <h2 className="text-xl font-semibold">Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms & Conditions at any
              time. Continued use of the website indicates acceptance of any
              changes.
            </p>

            <h2 className="text-xl font-semibold">Contact</h2>
            <p>
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

export default Terms;