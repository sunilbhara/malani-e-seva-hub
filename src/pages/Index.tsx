import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import MainServices from "@/components/MainServices";
import Services from "@/components/Services";
import MobileElectronics from "@/components/MobileElectronics";
import MatajiStudio from "@/components/MatajiStudio";
import Features from "@/components/Features";
import GoogleMap from "@/components/GoogleMap";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingActionButton from "@/components/FloatingActionButton";
import ErrorBoundary from "@/components/ErrorBoundary";
import Adsense from "@/components/Adsense";
import { FeaturedBlogSection } from "@/components/blog/FeaturedBlogSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navigation />
      <main>
        <section id="home">
          <Hero />
        </section>

        <FeaturedBlogSection />

        {/* Main Services Section - Equal Priority */}
        <MainServices />
        
        {/* Google AdSense Ad */}
        <div className="my-10 flex justify-center">
          <Adsense slot="1234567890" />
        </div>
        
        <section id="services">
          <Services />
        </section>
      <section id="mobile-electronics">
        <MobileElectronics />
      </section>
      <section id="mataji-studio">
        <MatajiStudio />
      </section>
      <section id="location">
        <ErrorBoundary>
          <GoogleMap 
            latitude={25.746793418531855}
            longitude={71.39670954386371}
            shopName="Malani Barmer"
            address="Near IDBI Bank, Barmer, Rajasthan"
            phone="+91 9950788973"
            hours="Monday - Saturday: 9:00 AM - 8:00 PM, Sunday: 10:00 AM - 6:00 PM"
          />
        </ErrorBoundary>
      </section>
      <section id="contact">
        <Contact />
      </section>
      </main>
      <FloatingActionButton />
      <Footer />
    </div>
  );
};

export default Index;
