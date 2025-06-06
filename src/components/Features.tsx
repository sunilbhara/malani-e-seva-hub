
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Users, Award, Star, CheckCircle } from "lucide-react";

const Features = () => {
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
    { number: "5000+", label: "Happy Customers", icon: Users },
    { number: "99.9%", label: "Success Rate", icon: CheckCircle },
    { number: "24/7", label: "Support Available", icon: Clock },
    { number: "50+", label: "Services Offered", icon: Star }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-br from-cyan-200/40 to-blue-200/40 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="space-y-6">
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 px-6 py-2 text-lg font-semibold shadow-lg">
                ⭐ Why Choose Us
              </Badge>
              <h2 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
                Most Trusted E-Mitra in Barmer
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                With years of experience and thousands of satisfied customers, 
                we are your most reliable partner for all government and digital services in Barmer.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="group p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-3 text-lg group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/50">
                  <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative transform hover:scale-105 transition-all duration-700 group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-500 rounded-3xl blur-2xl opacity-40 animate-pulse group-hover:opacity-60 transition-opacity duration-500"></div>
              <img 
                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80"
                alt="Professional Services"
                className="relative rounded-3xl shadow-2xl w-full border-2 border-white/30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 via-transparent to-transparent rounded-3xl"></div>
              
              {/* Floating achievement badge */}
              <div className="absolute -bottom-8 -right-8 bg-gradient-to-r from-yellow-400 to-orange-500 p-8 rounded-3xl shadow-2xl transform rotate-3 group-hover:rotate-6 transition-all duration-500 border-4 border-white">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-1">5000+</div>
                  <div className="text-white font-semibold">Happy Customers</div>
                  <div className="text-yellow-100 text-sm">& Counting...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
