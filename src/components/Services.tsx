
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Camera, CreditCard, Users, Globe, Shield, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import MobileSwiper from "@/components/mobile/MobileSwiper";
import { useInView } from "react-intersection-observer";
import { useI18n } from "@/i18n";
import DesktopCircularCarousel from "./Desktop/DesktopCircularCarousel";
import { cn } from "@/lib/utils";

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
    id: service.title,
    ...service,
    icon: [FileText, Camera, CreditCard, Users, Globe, Shield][index] ?? Shield,
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
        {/* <motion.div 
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
        </motion.div> */}

        {(() => {
          const renderCard = (service: typeof services[number], index = 0, compact = false, active = true) => (
            <Card
              className={cn(
                "group relative h-full overflow-hidden border-0 bg-white/85 shadow-lg backdrop-blur-sm transition-all duration-500 hover:shadow-2xl",
                compact ? "rounded-2xl" : "",
                compact && !active && "bg-white/70",
              )}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              <CardHeader className={cn("relative text-center", compact ? "pb-3" : "pb-4")}>
                <motion.div
                  className={cn(
                    `mx-auto flex items-center justify-center bg-gradient-to-br ${service.color} shadow-xl`,
                    compact ? "mb-4 h-16 w-16 rounded-2xl" : "mb-6 h-16 w-16 rounded-3xl lg:h-20 lg:w-20",
                  )}
                  initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
                  whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 180, damping: 14 }}
                >
                  <service.icon className={cn("text-white", compact ? "h-8 w-8" : "h-8 w-8 lg:h-10 lg:w-10")} />
                </motion.div>
                <CardTitle className={cn("font-bold text-gray-900", compact ? "text-xl" : "text-xl lg:text-2xl")}>
                  {service.title}
                </CardTitle>
              </CardHeader>
              {(!compact || active) && (
                <CardContent className={cn("relative", compact ? "space-y-4 px-5 pb-5" : "space-y-4 lg:space-y-6")}>
                  <p className={cn("text-center leading-relaxed text-gray-600", compact ? "line-clamp-3 text-sm" : "text-sm lg:text-base")}>
                    {service.description}
                  </p>
                  <div className={cn(compact ? "space-y-2" : "space-y-2 lg:space-y-3")}>
                    {service.features.slice(0, compact ? 3 : service.features.length).map((feature, idx) => (
                      <div
                        key={idx}
                        className={cn("flex items-center text-gray-700", compact ? "text-xs" : "text-xs lg:text-sm")}
                      >
                        <CheckCircle className={`w-3 h-3 lg:w-4 lg:h-4 mr-3 text-green-500`} />
                        <span className="font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );

          return (
            <>
              {/* Tablet grid */}
              <motion.div
                ref={ref}
                variants={containerVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                className="hidden gap-6 sm:grid sm:grid-cols-2 lg:hidden"
              >
                {services.map((service, index) => (
                  <motion.div
                    key={service.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -10, transition: { duration: 0.3 } }}
                  >
                    {renderCard(service, index)}
                  </motion.div>
                ))}
              </motion.div>

              {/* Desktop circular carousel */}
              <div className="hidden lg:block">
                <DesktopCircularCarousel
                  items={services}
                  cardWidth={330}
                  cardHeight={420}
                  radiusX={390}
                  radiusY={90}
                  renderItem={(service, { active }) => (
                    <div
                      className={cn(
                        "h-full transition",
                        active ? "cursor-default" : "cursor-pointer",
                      )}
                    >
                      {renderCard(service, 0, true, active)}
                    </div>
                  )}
                />
              </div>

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
