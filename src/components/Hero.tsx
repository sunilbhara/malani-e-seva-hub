
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, MapPin, User } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 text-white min-h-screen flex items-center">
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10 animate-fade-in">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-yellow-400/20 backdrop-blur-sm rounded-full border border-yellow-400/30">
                <span className="text-yellow-300 font-medium text-sm">✨ Authorized E-Mitra Center</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="block bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">Malani</span>
                <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-400 bg-clip-text text-transparent animate-pulse">E-Mitra Services</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed font-light">
                Your trusted partner for all government and digital services in Malani
              </p>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <User className="h-6 w-6 text-yellow-300" />
                <div>
                  <p className="text-sm text-blue-200">Proprietor</p>
                  <p className="text-lg font-semibold text-white">Tarun Bharati</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 group">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm font-semibold shadow-xl transform hover:scale-105 transition-all duration-300">
                View Services
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 text-sm">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Phone className="h-5 w-5 text-yellow-300" />
                <div>
                  <p className="text-blue-200">Call Us</p>
                  <span className="font-semibold">+91 9950788973</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <MapPin className="h-5 w-5 text-yellow-300" />
                <div>
                  <p className="text-blue-200">Visit Us</p>
                  <span className="font-semibold">Near IDBI Bank, Barmer</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative lg:block hidden">
            <div className="relative transform hover:scale-105 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                alt="E-Mitra Services"
                className="relative rounded-3xl shadow-2xl w-full max-w-lg mx-auto border border-white/20"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 via-transparent to-transparent rounded-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
