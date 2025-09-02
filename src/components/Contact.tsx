
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Clock, Mail, User, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const Contact = () => {
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
  return (
    <section className="py-16 lg:py-20 bg-gradient-to-br from-white via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Enhanced background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 6,
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
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold mb-6 shadow-lg animate-glow"
          >
            📞 Get In Touch
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-6 lg:mb-8"
          >
            Contact Tarun Bharati
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Visit our center or contact us for any assistance with e-Mitra services. 
            We're here to help you with all your government and digital service needs.
          </motion.p>
        </motion.div>

        <motion.div 
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid lg:grid-cols-2 gap-12 lg:gap-16"
        >
          <motion.div variants={itemVariants} className="space-y-6 lg:space-y-8">
            <motion.div variants={itemVariants} className="grid sm:grid-cols-2 gap-4 lg:gap-6">
              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.3 }
                }}
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-blue-50 overflow-hidden group h-full">
                  <CardContent className="p-6 lg:p-8 text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <motion.div 
                        className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <MapPin className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                      </motion.div>
                      <h3 className="font-bold text-gray-900 mb-3 text-base lg:text-lg">Our Address</h3>
                      <p className="text-gray-600 leading-relaxed text-sm lg:text-base">Near IDBI Bank Opp. Railway Station<br />Height School Road<br />Barmer 344001</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.3 }
                }}
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-green-50 overflow-hidden group h-full">
                  <CardContent className="p-6 lg:p-8 text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <motion.div 
                        className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Phone className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                      </motion.div>
                      <h3 className="font-bold text-gray-900 mb-3 text-base lg:text-lg">Phone Number</h3>
                      <p className="text-gray-600 text-base lg:text-lg font-semibold">+91 9950788973</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.3 }
                }}
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-orange-50 overflow-hidden group h-full">
                  <CardContent className="p-6 lg:p-8 text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <motion.div 
                        className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                      </motion.div>
                      <h3 className="font-bold text-gray-900 mb-3 text-base lg:text-lg">Working Hours</h3>
                      <p className="text-gray-600 text-sm lg:text-base">Mon-Sat: 9AM-7PM<br />Sunday: 10AM-8PM</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.3 }
                }}
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-purple-50 overflow-hidden group h-full">
                  <CardContent className="p-6 lg:p-8 text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <motion.div 
                        className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <User className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                      </motion.div>
                      <h3 className="font-bold text-gray-900 mb-3 text-base lg:text-lg">Proprietor</h3>
                      <p className="text-gray-600 text-base lg:text-lg font-semibold">Tarun Bharati</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
              <CardHeader className="relative">
                <CardTitle className="text-2xl lg:text-3xl text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">Send us a Message</CardTitle>
                <p className="text-center text-gray-600 mt-2 text-sm lg:text-base">We'll get back to you within 24 hours</p>
              </CardHeader>
              <CardContent className="space-y-4 lg:space-y-6 relative">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input placeholder="Your Name" className="h-12 lg:h-14 border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm" />
                  <Input placeholder="Phone Number" className="h-12 lg:h-14 border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm" />
                </div>
                <Input placeholder="Email Address" className="h-12 lg:h-14 border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm" />
                <Input placeholder="Service Required" className="h-12 lg:h-14 border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm" />
                <Textarea placeholder="Your Message" rows={4} className="border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm" />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 h-12 lg:h-14 text-base lg:text-lg font-bold shadow-xl transform hover:scale-105 transition-all duration-300 group">
                    <Send className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                    Send Message
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
