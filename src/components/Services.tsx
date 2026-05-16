
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Camera, CreditCard, Users, Globe, Shield, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import MobileSwiper from "@/components/mobile/MobileSwiper";
import { useInView } from "react-intersection-observer";
import { useI18n } from "@/i18n";

const Services = () => {
  const { messages } = useI18n();
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
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };
  const services = messages.homepage.services.items.map((service, index) => ({
    ...service,
    icon: [FileText, Camera, CreditCard, Users, Globe, Shield][index],
    color: [
      "from-blue-500 to-purple-600",
      "from-green-500 to-teal-600",
      "from-orange-500 to-red-600",
      "from-purple-500 to-pink-600",
      "from-cyan-500 to-blue-600",
      "from-indigo-500 to-purple-600",
    ][index],
  }));

  return (
    <section className="py-16 lg:py-20 custom-light-gradient-bg relative overflow-hidden">
      {/* Enhanced background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200/30 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 lg:mb-20"
        >
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={inView ? { scale: 1 } : { scale: 0.8 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block custom-pill-theme font-semibold mb-6"
          >
            🚀 Our Premium Services
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold custom-gradient-text mb-6 lg:mb-8"
          >
            Your One-Stop Solution
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
          >
            {messages.homepage.services.description}
          </motion.p>
        </motion.div>

        {(() => {
          const renderCard = (service: typeof services[number], index = 0) => (
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden relative h-full">
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              <CardHeader className="text-center pb-4 relative">
                <motion.div
                  className={`mx-auto w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br ${service.color} rounded-3xl flex items-center justify-center mb-6 shadow-xl`}
                  initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
                  whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 180, damping: 14 }}
                >
                  <service.icon className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                </motion.div>
                <CardTitle className="text-xl lg:text-2xl font-bold text-gray-900">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6 relative">
                <p className="text-gray-600 leading-relaxed text-center text-sm lg:text-base">
                  {service.description}
                </p>
                <div className="space-y-2 lg:space-y-3">
                  {service.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center text-xs lg:text-sm text-gray-700"
                    >
                      <CheckCircle className={`w-3 h-3 lg:w-4 lg:h-4 mr-3 text-green-500`} />
                      <span className="font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );

          return (
            <>
              {/* Desktop / tablet grid - unchanged */}
              <motion.div
                ref={ref}
                variants={containerVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
              >
                {services.map((service, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -10, transition: { duration: 0.3 } }}
                  >
                    {renderCard(service, index)}
                  </motion.div>
                ))}
              </motion.div>

              {/* Mobile-only premium showcase carousel */}
              <div className="sm:hidden">
                <MobileSwiper
                  items={services}
                  autoplayDelay={3000}
                  slidesPerView={1.1}
                  spaceBetween={16}
                  paginationColorVar="#8b5cf6"
                  slideClassName="!h-auto pb-2"
                  renderItem={(service) => (
                    <div className="h-full px-1">{renderCard(service)}</div>
                  )}
                />
              </div>
            </>
          );
        })()}
      </div>
    </section>
  );
};

export default Services;
