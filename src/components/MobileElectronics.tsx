import { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Headphones, Laptop, Camera, Filter, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MobileElectronics = () => {
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

  const categories = [
    { id: 'all', name: 'All Products', icon: Filter },
    { id: 'mobiles', name: 'Mobiles', icon: Smartphone },
    { id: 'accessories', name: 'Accessories', icon: Headphones },
    { id: 'appliances', name: 'Appliances', icon: Laptop }
  ];

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
            Malani Mobile & Electronics
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover the latest in mobile technology and electronics. Premium quality, competitive prices, and expert service.
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
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  rotateY: 0,
                  transition: { delay: index * 0.1 }
                }}
                exit={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                whileHover={{ 
                  y: -10, 
                  rotateY: 5,
                  transition: { type: "spring", stiffness: 300 }
                }}
                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200/50"
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
              >
                {/* Product Image */}
                <div className="relative overflow-hidden h-64 bg-gradient-to-br from-gray-100 to-gray-200">
                  <motion.img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    whileHover={{ scale: 1.1 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Rating Badge */}
                  <Badge className="absolute top-4 right-4 bg-yellow-500 text-white border-0">
                    <Star className="w-3 h-3 mr-1 fill-white" />
                    {product.rating}
                  </Badge>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  {/* Features */}
                  <div className="space-y-1 mb-4">
                    {product.features.map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.1 }}
                        className="text-sm text-gray-600 flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        {feature}
                      </motion.div>
                    ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">
                      
                    </span>
                    <Button 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0"
                      size="sm"
                      onClick={() =>
                        window.open(`https://wa.me/919950788973?text=I'm%20interested%20in%20the%20${encodeURIComponent(product.name)}%20please%20provide%20details`, '_blank')
                      }
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy Now
                    </Button>
                  </div>
                </div>

                {/* 3D Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Visit Our Store Today!
          </h3>
          <p className="text-gray-600 mb-6">
            Expert advice, competitive prices, and genuine products guaranteed.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Authorized Dealer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>1 Year Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>Easy EMI Available</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MobileElectronics;