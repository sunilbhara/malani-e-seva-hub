import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navigation />

      <main className="container mx-auto px-4 pt-32 pb-16">

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-10 text-gray-800"
        >
          About Malani Barmer
        </motion.h1>

        <Card className="shadow-lg border border-gray-200">
          <CardContent className="space-y-6 text-gray-700 leading-relaxed pt-6">

            <p>
              <strong>Malani Barmer</strong> is a complete service hub located
              near IDBI Bank in Barmer, Rajasthan. We aim to provide essential
              digital and electronic services to the local community with
              reliability and convenience.
            </p>

            <h2 className="text-xl font-semibold">Our Services</h2>

            <ul className="list-disc ml-6 space-y-2">
              <li>E-Mitra Services</li>
              <li>Government Form Services</li>
              <li>Mobile & Electronics Accessories</li>
              <li>Photography & Studio Services</li>
              <li>Printing & Documentation Services</li>
            </ul>

            <h2 className="text-xl font-semibold">Our Mission</h2>

            <p>
              Our mission is to simplify access to digital services for people
              in Barmer by providing fast, transparent, and reliable support in
              one place.
            </p>

            <h2 className="text-xl font-semibold">Why Choose Us</h2>

            <ul className="list-disc ml-6 space-y-2">
              <li>Trusted local service provider</li>
              <li>Quick and reliable solutions</li>
              <li>Affordable pricing</li>
              <li>Customer-friendly support</li>
            </ul>

            <h2 className="text-xl font-semibold">Location</h2>

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

export default About;