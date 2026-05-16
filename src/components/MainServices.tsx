import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  FileText, 
  Smartphone, 
  Camera, 
  ArrowRight, 
  Star,
  CheckCircle,
  Users,
  Clock
} from "lucide-react";
import MobileSwiper from "@/components/mobile/MobileSwiper";

const MainServices = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const services = [
    {
      id: "emitra",
      title: "E-Mitra Services",
      description: "Government authorized digital services for all your official needs. Fast, reliable, and secure processing.",
      icon: FileText,
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&h=300&fit=crop",
      features: ["Government Forms", "Certificate Applications", "Bill Payments", "Digital Services"],
      stats: "50,000+ Documents Processed",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      href: "#services"
    },
    {
      id: "mobile",
      title: "Mobile & Electronics", 
      description: "Latest smartphones, gadgets, and electronics with warranty. Authorized dealer with competitive prices.",
      icon: Smartphone,
      image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500&h=300&fit=crop",
      features: ["Latest Mobiles", "Electronics", "Accessories", "Warranties"],
      stats: "1000+ Happy Customers",
      gradient: "from-purple-500 to-pink-500", 
      bgGradient: "from-purple-50 to-pink-50",
      href: "#mobile-electronics"
    },
    {
      id: "studio",
      title: "Mataji Studio",
      description: "Professional photography services for weddings, events, and portraits. Capturing your precious moments.",
      icon: Camera,
      image: "https://images.unsplash.com/photo-1650688331261-fd5e6de2e23a?w=500&h=300&fit=crop",
      features: ["Wedding Photography", "Event Coverage", "Portrait Sessions", "Digital Albums"],
      stats: "500+ Events Covered",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50", 
      href: "#mataji-studio"
    }
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.div variants={itemVariants} className="space-y-6">
            <motion.div 
              variants={itemVariants}
              className="inline-block px-6 py-3 rounded-full custom-gradient-pill"
            >
              <span className="text-white font-semibold text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Our Core Services
              </span>
            </motion.div>

            
            <motion.h2 
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold custom-gradient-text"
            >
              Everything You Need
              <span className="block text-3xl sm:text-4xl lg:text-5xl mt-2">Under One Roof</span>
            </motion.h2>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            >
              From government services to modern electronics and professional photography - 
              we're your complete solution in Barmer
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Reusable card renderer for both desktop grid and mobile carousel */}
        {(() => {
          const renderCard = (service: typeof services[number], isMobile = false) => {
            const Icon = service.icon;
            return (
              <Card className={`h-full bg-gradient-to-br ${service.bgGradient} border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden ${isMobile ? "rounded-3xl" : ""}`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <div className="relative h-44 sm:h-48 overflow-hidden rounded-t-xl">
                  <img
                    src={service.image}
                    alt={service.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className={`absolute top-4 right-4 w-12 h-12 bg-gradient-to-r ${service.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="p-6 sm:p-8 space-y-5 relative">
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{service.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{service.description}</p>
                  </div>
                  <div className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                    <Users className="h-4 w-4" />
                    {service.stats}
                  </div>
                  <Button
                    onClick={() => scrollToSection(service.href)}
                    className={`w-full bg-gradient-to-r ${service.gradient} hover:opacity-90 text-white font-semibold shadow-lg`}
                    size="lg"
                  >
                    Explore {service.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          };

          return (
            <>
              {/* Desktop / tablet grid - unchanged */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {services.map((service) => (
                  <motion.div
                    key={service.id}
                    variants={itemVariants}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="group relative"
                  >
                    {renderCard(service)}
                  </motion.div>
                ))}
              </motion.div>

              {/* Mobile-only stacked-card carousel */}
              <div className="md:hidden">
                <MobileSwiper
                  items={services}
                  variant="coverflow"
                  autoplayDelay={3500}
                  paginationColorVar="#3b82f6"
                  slideClassName="!h-auto"
                  renderItem={(service) => (
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="group relative pb-2"
                    >
                      <div className={`absolute -inset-1 bg-gradient-to-r ${service.gradient} opacity-30 blur-2xl rounded-3xl pointer-events-none`} />
                      <div className="relative">{renderCard(service, true)}</div>
                    </motion.div>
                  )}
                />
              </div>
            </>
          );
        })()}

        {/* Bottom CTA Section */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="mt-20 text-center"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4 text-yellow-500">
                <Star className="h-6 w-6 fill-current" />
                <Star className="h-6 w-6 fill-current" />
                <Star className="h-6 w-6 fill-current" />
                <Star className="h-6 w-6 fill-current" />
                <Star className="h-6 w-6 fill-current" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">
                Trusted by 50,000+ Customers in Barmer
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span>Quick Service</span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Government Authorized</span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MainServices;