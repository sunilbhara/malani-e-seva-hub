
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Users, Award, Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const Features = () => {
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
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };
  const features = [
    {
      icon: Clock,
      title: "Lightning Fast Service",
      description: "Quick processing and instant results for most services with minimal waiting time"
    },
    {
      icon: Shield,
      title: "100% Secure & Reliable",
      description: "Your data is completely safe with our advanced security systems and encryption"
    },
    {
      icon: Users,
      title: "Expert Professional Support",
      description: "Experienced and certified staff to help you with all your requirements"
    },
    {
      icon: Award,
      title: "Government Certified Center",
      description: "Officially authorized e-Mitra service center with proper licensing"
    }
  ];

  const stats = [
    { number: "50000+", label: "Happy Customers", icon: Users },
    { number: "99.9%", label: "Success Rate", icon: CheckCircle },
    { number: "24/7", label: "Support Available", icon: Clock },
    { number: "50+", label: "Services Offered", icon: Star }
  ];

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Enhanced background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-br from-cyan-200/40 to-blue-200/40 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div 
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
        >
          <motion.div variants={itemVariants} className="space-y-8 lg:space-y-10">
            <motion.div variants={itemVariants} className="space-y-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={inView ? { scale: 1 } : { scale: 0.8 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 px-6 py-2 text-lg font-semibold shadow-lg animate-glow">
                  ⭐ Why Choose Us
                </Badge>
              </motion.div>
              <motion.h2 
                variants={itemVariants}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight"
              >
                Most Trusted E-Mitra in Barmer
              </motion.h2>
              <motion.p 
                variants={itemVariants}
                className="text-lg lg:text-xl text-gray-600 leading-relaxed"
              >
                With years of experience and thousands of satisfied customers, 
                we are your most reliable partner for all government and digital services in Barmer.
              </motion.p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid sm:grid-cols-2 gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05,
                    y: -5,
                    transition: { duration: 0.3 }
                  }}
                  className="group p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50"
                >
                  <div className="flex items-start space-x-4">
                    <motion.div 
                      className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <feature.icon className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-3 text-base lg:text-lg group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Enhanced Stats section */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 pt-8">
              {stats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.1,
                    y: -5,
                    transition: { duration: 0.3 }
                  }}
                  className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                  >
                    <stat.icon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mx-auto mb-2" />
                  </motion.div>
                  <motion.div 
                    className="text-xl lg:text-2xl font-bold text-gray-900 mb-1"
                    initial={{ scale: 0 }}
                    animate={inView ? { scale: 1 } : { scale: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  >
                    {stat.number}
                  </motion.div>
                  <div className="text-gray-600 text-xs lg:text-sm font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <motion.div 
              className="relative transform hover:scale-105 transition-all duration-700 group"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-500 rounded-3xl blur-2xl opacity-40 animate-pulse group-hover:opacity-60 transition-opacity duration-500"></div>
              <img 
                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80"
                alt="Professional Services"
                className="relative rounded-3xl shadow-2xl w-full border-2 border-white/30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 via-transparent to-transparent rounded-3xl"></div>
              
              {/* Enhanced floating achievement badge */}
              <motion.div 
                className="absolute -bottom-6 -right-6 lg:-bottom-8 lg:-right-8 bg-gradient-to-r from-yellow-400 to-orange-500 p-6 lg:p-8 rounded-3xl shadow-2xl transform rotate-3 group-hover:rotate-6 transition-all duration-500 border-4 border-white"
                animate={{ 
                  rotate: [3, 6, 3],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <div className="text-center">
                  <div className="text-2xl lg:text-4xl font-bold text-white mb-1">50000+</div>
                  <div className="text-white font-semibold text-sm lg:text-base">Happy Customers</div>
                  <div className="text-yellow-100 text-xs lg:text-sm">& Counting...</div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
