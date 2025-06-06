
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Camera, CreditCard, Users, Globe, Shield } from "lucide-react";

const Services = () => {
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
    <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200/30 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-20">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold mb-6 shadow-lg">
            🚀 Our Premium Services
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-8">
            Your One-Stop Solution
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            We provide comprehensive e-governance and digital services to make your life easier. 
            From form filling to money transfers, we've got you covered with professional expertise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              
              <CardHeader className="text-center pb-4 relative">
                <div className={`mx-auto w-20 h-20 bg-gradient-to-br ${service.color} rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl`}>
                  <service.icon className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                  {service.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6 relative">
                <p className="text-gray-600 leading-relaxed text-center">
                  {service.description}
                </p>
                <div className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-700 group-hover:text-gray-800 transition-colors">
                      <div className={`w-3 h-3 bg-gradient-to-r ${service.color} rounded-full mr-3 shadow-sm`}></div>
                      <span className="font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
