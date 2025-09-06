
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Camera, CreditCard, Users, Globe, Shield, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const Services = () => {
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
  const services = [
    {
      icon: FileText,
      title: "Form Filling Services",
      description: "Complete assistance for exam forms, job applications, government forms, and online registrations",
      features: ["Exam Registration", "Job Applications", "Government Forms", "Online Applications"],
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: Camera,
      title: "Passport Size Photos",
      description: "Professional quality passport size photos for all official documents and applications",
      features: ["Instant Printing", "Digital Format", "All Sizes Available", "Government Standard"],
      color: "from-green-500 to-teal-600"
    },
    {
      icon: CreditCard,
      title: "Money Transfer",
      description: "Secure and fast money transfer services with competitive rates and instant processing",
      features: ["Bank Transfers", "Mobile Wallets", "Cash Pickup", "International Transfers"],
      color: "from-orange-500 to-red-600"
    },
    {
      icon: Users,
      title: "Bill Payments",
      description: "Pay all your utility bills, mobile recharge, and government fees in one place",
      features: ["Electricity Bills", "Mobile Recharge", "Water Bills", "Government Fees"],
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Globe,
      title: "Digital Services",
      description: "Complete range of digital government services and online document processing",
      features: ["Aadhaar Services", "PAN Card", "Voter ID", "Digital Certificates"],
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: Shield,
      title: "Insurance Services",
      description: "Comprehensive insurance solutions for life, health, vehicle, and property protection",
      features: ["Life Insurance", "Health Insurance", "Vehicle Insurance", "Property Insurance"],
      color: "from-indigo-500 to-purple-600"
    }
  ];

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
            We provide comprehensive e-governance and digital services to make your life easier. 
            From form filling to money transfers, we've got you covered with professional expertise.
          </motion.p>
        </motion.div>

        <motion.div 
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                y: -10,
                transition: { duration: 0.3 }
              }}
            >
              <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden relative h-full">
                <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <CardHeader className="text-center pb-4 relative">
                  <motion.div 
                    className={`mx-auto w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br ${service.color} rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <service.icon className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                  </motion.div>
                  <CardTitle className="text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4 lg:space-y-6 relative">
                  <p className="text-gray-600 leading-relaxed text-center text-sm lg:text-base">
                    {service.description}
                  </p>
                  <div className="space-y-2 lg:space-y-3">
                    {service.features.map((feature, idx) => (
                      <motion.div 
                        key={idx} 
                        className="flex items-center text-xs lg:text-sm text-gray-700 group-hover:text-gray-800 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                        transition={{ duration: 0.5, delay: 0.1 * (index + idx) }}
                      >
                        <CheckCircle className={`w-3 h-3 lg:w-4 lg:h-4 bg-gradient-to-r ${service.color} rounded-full mr-3 text-green-500`} />
                        <span className="font-medium">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Services;
