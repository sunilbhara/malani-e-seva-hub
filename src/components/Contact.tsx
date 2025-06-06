
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Clock, Mail, User } from "lucide-react";

const Contact = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-white via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-20">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold mb-6 shadow-lg">
            📞 Get In Touch
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-8">
            Contact Tarun Bharati
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Visit our center or contact us for any assistance with e-Mitra services. 
            We're here to help you with all your government and digital service needs.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-blue-50 overflow-hidden group">
                <CardContent className="p-8 text-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">Our Address</h3>
                    <p className="text-gray-600 leading-relaxed">Near IDBI Bank Opp. Railway Station<br />Height School Road<br />Barmer 344001</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-green-50 overflow-hidden group">
                <CardContent className="p-8 text-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <Phone className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">Phone Number</h3>
                    <p className="text-gray-600 text-lg font-semibold">+91 9950788973</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-orange-50 overflow-hidden group">
                <CardContent className="p-8 text-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">Working Hours</h3>
                    <p className="text-gray-600">Mon-Sat: 9AM-7PM<br />Sunday: 10AM-5PM</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-purple-50 overflow-hidden group">
                <CardContent className="p-8 text-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">Proprietor</h3>
                    <p className="text-gray-600 text-lg font-semibold">Tarun Bharati</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
            <CardHeader className="relative">
              <CardTitle className="text-3xl text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">Send us a Message</CardTitle>
              <p className="text-center text-gray-600 mt-2">We'll get back to you within 24 hours</p>
            </CardHeader>
            <CardContent className="space-y-6 relative">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input placeholder="Your Name" className="h-14 border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm" />
                <Input placeholder="Phone Number" className="h-14 border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm" />
              </div>
              <Input placeholder="Email Address" className="h-14 border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm" />
              <Input placeholder="Service Required" className="h-14 border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm" />
              <Textarea placeholder="Your Message" rows={5} className="border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm" />
              <Button className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 h-14 text-lg font-bold shadow-xl transform hover:scale-105 transition-all duration-300">
                Send Message 🚀
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;
