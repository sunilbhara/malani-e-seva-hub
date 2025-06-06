
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Users, Award } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Clock,
      title: "Fast Service",
      description: "Quick processing and instant results for most services"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your data is safe with our secure processing systems"
    },
    {
      icon: Users,
      title: "Expert Support",
      description: "Experienced staff to help you with all your requirements"
    },
    {
      icon: Award,
      title: "Certified Center",
      description: "Government authorized e-Mitra service center"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                Why Choose Us
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Trusted E-Mitra Services in Malani
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                With years of experience and thousands of satisfied customers, 
                we are your reliable partner for all government and digital services.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:bg-green-500 transition-colors duration-300">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80"
              alt="Professional Services"
              className="rounded-2xl shadow-2xl w-full"
            />
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">1000+</div>
                <div className="text-gray-600">Happy Customers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
