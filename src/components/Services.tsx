
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Camera, CreditCard, Users, Globe, Shield } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: FileText,
      title: "Form Filling Services",
      description: "Complete assistance for exam forms, job applications, government forms, and online registrations",
      features: ["Exam Registration", "Job Applications", "Government Forms", "Online Applications"]
    },
    {
      icon: Camera,
      title: "Passport Size Photos",
      description: "Professional quality passport size photos for all official documents and applications",
      features: ["Instant Printing", "Digital Format", "All Sizes Available", "Government Standard"]
    },
    {
      icon: CreditCard,
      title: "Money Transfer",
      description: "Secure and fast money transfer services with competitive rates and instant processing",
      features: ["Bank Transfers", "Mobile Wallets", "Cash Pickup", "International Transfers"]
    },
    {
      icon: Users,
      title: "Bill Payments",
      description: "Pay all your utility bills, mobile recharge, and government fees in one place",
      features: ["Electricity Bills", "Mobile Recharge", "Water Bills", "Government Fees"]
    },
    {
      icon: Globe,
      title: "Digital Services",
      description: "Complete range of digital government services and online document processing",
      features: ["Aadhaar Services", "PAN Card", "Voter ID", "Digital Certificates"]
    },
    {
      icon: Shield,
      title: "Insurance Services",
      description: "Comprehensive insurance solutions for life, health, vehicle, and property protection",
      features: ["Life Insurance", "Health Insurance", "Vehicle Insurance", "Property Insurance"]
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We provide comprehensive e-governance and digital services to make your life easier. 
            From form filling to money transfers, we've got you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
