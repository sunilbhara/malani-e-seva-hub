import { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Headphones, Laptop, Camera, Filter, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MobileSwiper from "@/components/mobile/MobileSwiper";
import { useI18n } from "@/i18n";

const MobileElectronics = () => {
  const { messages } = useI18n();
  const [activeFilter, setActiveFilter] = useState('all');

  const products = [
    {
      id: 1,
      name: "iPhone 15 Pro",
      category: "mobiles",
      price: "₹1,34,900",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop",
      features: ["A17 Pro Chip", "48MP Camera", "Titanium Build"]
    },
    {
      id: 2,
      name: "Samsung Galaxy S24",
      category: "mobiles",
      price: "₹79,999",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop",
      features: ["AI Photography", "120Hz Display", "5000mAh Battery"]
    },
    {
      id: 3,
      name: "Sony WH-1000XM5",
      category: "accessories",
      price: "₹29,990",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
      features: ["Noise Cancelling", "30hr Battery", "Premium Sound"]
    },
    {
      id: 4,
      name: "MacBook Air M3",
      category: "appliances",
      price: "₹1,14,900",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
      features: ["M3 Chip", "18hr Battery", "Liquid Retina"]
    },
    {
      id: 5,
      name: "AirPods Pro",
      category: "accessories",
      price: "₹24,900",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop",
      features: ["Active Noise Cancel", "Spatial Audio", "MagSafe Case"]
    },
    {
      id: 6,
      name: "LG OLED TV 55\"",
      category: "appliances",
      price: "₹1,49,990",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
      features: ["4K OLED", "Smart TV", "Dolby Vision"]
    }
  ];

  const categories = messages.homepage.mobileElectronics.categories.map((category, index) => ({
    ...category,
    icon: [Filter, Smartphone, Headphones, Laptop][index],
  }));

  const filteredProducts = activeFilter === 'all' 
    ? products 
    : products.filter(product => product.category === activeFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-20">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {messages.homepage.mobileElectronics.title}
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {messages.homepage.mobileElectronics.description}
          </p>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveFilter(category.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    activeFilter === category.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'bg-white/70 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Products Grid */}
        {(() => {
          const renderProduct = (product: typeof products[number], index = 0, isMobile = false) => (
            <div
              className={`group relative bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200/50 ${isMobile ? "rounded-3xl" : "rounded-2xl"}`}
            >
              <div className={`relative overflow-hidden ${isMobile ? "h-56" : "h-64"} bg-gradient-to-br from-gray-100 to-gray-200`}>
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-90" />
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                  className="absolute top-4 right-4"
                >
                  <Badge className="bg-yellow-500 text-white border-0 shadow-lg">
                    <Star className="w-3 h-3 mr-1 fill-white" />
                    {product.rating}
                  </Badge>
                </motion.div>
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <div className="space-y-1 mb-4">
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">{product.price}</span>
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://wa.me/919950788973?text=I'm%20interested%20in%20the%20${encodeURIComponent(product.name)}%20please%20provide%20details`,
                        "_blank"
                      )
                    }
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {messages.homepage.mobileElectronics.buyNow}
                  </Button>
                </div>
              </div>
            </div>
          );

          return (
            <>
              {/* Desktop / tablet grid - unchanged */}
              <motion.div layout className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1, transition: { delay: index * 0.1 } }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ y: -10, transition: { type: "spring", stiffness: 300 } }}
                    >
                      {renderProduct(product, index)}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Mobile-only immersive product carousel */}
              <div className="md:hidden">
                <MobileSwiper
                  key={activeFilter}
                  items={filteredProducts}
                  variant="coverflow"
                  autoplayDelay={3200}
                  paginationColorVar="#6366f1"
                  slideClassName="!h-auto"
                  renderItem={(product, idx) => renderProduct(product, idx, true)}
                />
              </div>
            </>
          );
        })()}

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            {messages.homepage.mobileElectronics.contactTitle}
          </h3>
          <p className="text-gray-600 mb-6">
            {messages.homepage.mobileElectronics.contactDescription}
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>{messages.homepage.mobileElectronics.contactHighlights[0]}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{messages.homepage.mobileElectronics.contactHighlights[1]}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>{messages.homepage.mobileElectronics.contactHighlights[2]}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MobileElectronics;
