
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Features from "@/components/Features";
import GoogleMap from "@/components/GoogleMap";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingActionButton from "@/components/FloatingActionButton";
import ErrorBoundary from "@/components/ErrorBoundary";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navigation />
      <section id="home">
        <Hero />
      </section>
      <section id="services">
        <Services />
      </section>
      <section id="features">
        <Features />
      </section>
             <section id="location">
         <ErrorBoundary>
           <GoogleMap 
             latitude={25.746793418531855}
             longitude={71.39670954386371}
             shopName="Malani E-Mitra Services"
             address="Near IDBI Bank, Barmer, Rajasthan"
             phone="+91 9950788973"
             hours="Monday - Saturday: 9:00 AM - 8:00 PM"
           />
         </ErrorBoundary>
       </section>
      <section id="contact">
        <Contact />
      </section>
      <FloatingActionButton />
      <Footer />
    </div>
  );
};

export default Index;
