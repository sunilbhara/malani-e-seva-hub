
import { MapPin, Phone, Mail, Clock, User, Star, Instagram, Youtube, ShieldCheck, FileText, Info, LifeBuoy } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="custom-gradient-bg text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-6 lg:col-span-2">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Malani Barmer
              </h3>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <User className="h-6 w-6 text-yellow-400" />
                <div>
                  <p className="text-blue-200">Proprietor</p>
                  <p className="text-xl font-semibold text-white">Tarun Bharti</p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-300 leading-relaxed text-lg">
              Your complete solution hub for E-Mitra services, mobile electronics, and professional photography in Barmer, Rajasthan. 
              We provide comprehensive, reliable, and efficient services under one roof.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors">
                <MapPin className="h-5 w-5 text-yellow-400" />
                <span>Near IDBI Bank Opp. Railway Station, High School Road, Barmer 344001</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors">
                <Phone className="h-5 w-5 text-yellow-400" />
                <span>+91 9950788973</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xl font-bold text-white border-b-2 border-yellow-400 pb-2 inline-block">Quick Services</h4>
            <ul className="space-y-3 text-gray-300">
              {[
                "📝 Form Filling",
                "📸 Passport Photos", 
                "💰 Money Transfer",
                "⚡ Bill Payments",
                "🌐 Digital Services",
                "🛡️ Insurance Services"
              ].map((service, index) => (
                <li key={index} className="hover:text-yellow-400 transition-colors cursor-pointer transform hover:translate-x-2 transition-transform duration-200">
                  {service}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xl font-bold text-white border-b-2 border-yellow-400 pb-2 inline-block">Contact Info</h4>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-center space-x-3 hover:text-white transition-colors">
                <Phone className="h-5 w-5 text-yellow-400" />
                <span>+91 9950788973</span>
              </div>
              <div className="flex items-center space-x-3 hover:text-white transition-colors">
                <Mail className="h-5 w-5 text-yellow-400" />
                <span>malanibme@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3 hover:text-white transition-colors">
                <Clock className="h-5 w-5 text-yellow-400" />
                <span>Mon-Sat: 9AM-7PM, Sun: 10AM-8PM</span>
              </div>
              <div className="flex items-center space-x-3 hover:text-white transition-colors">
                <Star className="h-5 w-5 text-yellow-400" />
                <span>50000+ Happy Customers</span>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-white">Follow Us</h5>
              <div className="flex space-x-4">
                <a 
                  href="https://www.instagram.com/malani_mobile_barmer/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                  <span >Instagram</span>
                </a>
              </div>
              <div className="flex space-x-4">
                <a 
                  href="https://www.youtube.com/@MalaniMobileandElectronices" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  <Youtube className="h-5 w-5" />
                  <span >YouTube</span>
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-white">Important Links</h5>

              <ul className="space-y-3 text-gray-300">

                <li className="flex items-center space-x-2 hover:text-yellow-400 transition-colors">
                  <ShieldCheck className="h-4 w-4 text-yellow-400" />
                  <Link
                    to="/privacy-policy"
                    className="transform hover:translate-x-2 transition-transform duration-200"
                  >
                    Privacy Policy
                  </Link>
                </li>

                <li className="flex items-center space-x-2 hover:text-yellow-400 transition-colors">
                  <FileText className="h-4 w-4 text-yellow-400" />
                  <Link
                    to="/terms"
                    className="transform hover:translate-x-2 transition-transform duration-200"
                  >
                    Terms & Conditions
                  </Link>
                </li>

                <li className="flex items-center space-x-2 hover:text-yellow-400 transition-colors">
                  <Info className="h-4 w-4 text-yellow-400" />
                  <Link
                    to="/about"
                    className="transform hover:translate-x-2 transition-transform duration-200"
                  >
                    About Us
                  </Link>
                </li>

                <li className="flex items-center space-x-2 hover:text-yellow-400 transition-colors">
                  <LifeBuoy className="h-4 w-4 text-yellow-400" />
                  <Link
                    to="/#contact"
                    className="transform hover:translate-x-2 transition-transform duration-200"
                  >
                    Help & Support
                  </Link>
                </li>

              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-center md:text-left">
              &copy; {new Date().getFullYear()} Malani Barmer. All rights reserved. | Complete Solutions Hub
            </p>
            <div className="flex items-center gap-2 text-yellow-400">
              <Star className="h-4 w-4" />
              <span className="text-sm">Rated 4.9/5 by customers</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
