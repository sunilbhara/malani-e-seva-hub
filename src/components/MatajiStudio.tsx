import { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Heart, Star, Calendar, X, Phone, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import BookingForm from './MatajiStudioForm';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MatajiStudio = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

  const photoCategories = [
    { id: 'all', name: 'All Photos', icon: Camera },
    { id: 'weddings', name: 'Weddings', icon: Heart },
    { id: 'portraits', name: 'Portraits', icon: User },
    { id: 'events', name: 'Events', icon: Star }
  ];

  const photos = [
    {
      id: 1,
      category: 'weddings',
      title: 'Royal Wedding Ceremony',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&h=600&fit=crop',
      description: 'Beautiful traditional wedding photography capturing precious moments'
    },
    {
      id: 2,
      category: 'portraits',
      title: 'Professional Portrait',
      image: 'https://images.unsplash.com/photo-1580928891465-837f64326c73?w=500&h=600&fit=crop',
      description: 'Stunning portrait session with professional lighting'
    },
    {
      id: 3,
      category: 'events',
      title: 'Corporate Event',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&h=600&fit=crop',
      description: 'Professional event photography for corporate functions'
    },
    {
      id: 4,
      category: 'weddings',
      title: 'Pre-Wedding Shoot',
      image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=500&h=700&fit=crop',
      description: 'Romantic pre-wedding photography in beautiful locations'
    },
    {
      id: 5,
      category: 'portraits',
      title: 'Family Portrait',
      image: 'https://images.unsplash.com/photo-1640953148126-1962ec17a92b?w=500&h=600&fit=crop',
      description: 'Heartwarming family portrait session'
    },
    {
      id: 6,
      category: 'events',
      title: 'Birthday Celebration',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&h=700&fit=crop',
      description: 'Joyful birthday party photography'
    },
    {
      id: 7,
      category: 'weddings',
      title: 'Reception Moments',
      image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=500&h=600&fit=crop',
      description: 'Capturing the joy and celebration of wedding receptions'
    },
    {
      id: 8,
      category: 'weddings',
      title: 'Wedding Moments',
      image: 'https://images.unsplash.com/photo-1633104502699-b2ecf0fee294?w=500&h=700&fit=crop',
      description: 'Capturing the joy and celebration of weddings'
    },
    {
      id: 9,
      category: 'portraits',
      title: 'Business Headshots',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=600&fit=crop',
      description: 'Professional business headshots for corporate profiles'
    }
  ];

  const filteredPhotos = activeCategory === 'all' 
    ? photos 
    : photos.filter(photo => photo.category === activeCategory);

  // Masonry layout helper - distribute photos into columns
  const createMasonryColumns = (items, columnCount = 3) => {
    const columns = Array.from({ length: columnCount }, () => []);
    items.forEach((item, index) => {
      columns[index % columnCount].push(item);
    });
    return columns;
  };

  const columns = createMasonryColumns(filteredPhotos, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-100 py-20">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
            Mataji Studio
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Capturing life's precious moments with artistic vision and professional expertise. 
            Every photo tells a story, let us help you tell yours beautifully.
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {photoCategories.map((category) => {
              const Icon = category.icon;
              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/70 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </motion.button>
              );
            })}
          </div>

          <BookingForm />

        </motion.div>

        {/* Masonry Photo Gallery */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-6">
              <AnimatePresence>
                {column.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: { delay: (columnIndex + index) * 0.1 }
                    }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    whileHover={{ 
                      y: -8,
                      transition: { type: "spring", stiffness: 300 }
                    }}
                    className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
                    onClick={() => setSelectedImage(photo)}
                  >
                    {/* Photo */}
                    <div className="relative overflow-hidden">
                      <motion.img
                        src={photo.image}
                        alt={photo.title}
                        className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                        whileHover={{ scale: 1.05 }}
                        loading="lazy"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Category Badge */}
                      <Badge className="absolute top-4 left-4 bg-white/90 text-gray-700 border-0 capitalize">
                        {photo.category}
                      </Badge>
                      
                      {/* Title Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="font-bold text-lg mb-2">{photo.title}</h3>
                        <p className="text-sm text-gray-200">{photo.description}</p>
                      </div>
                    </div>

                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        {/* Image Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative max-w-4xl max-h-full bg-white rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedImage.title}</h3>
                  <p className="text-gray-600">{selectedImage.description}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Studio Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-16 grid md:grid-cols-2 gap-8"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Why Choose Mataji Studio?</h3>
            <div className="space-y-3">
              {[
                'Professional equipment and lighting',
                'Experienced photographers',
                'Quick turnaround time',
                'Affordable packages',
                'Custom editing services',
                'Digital and print delivery'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-purple-500" />
                <span className="text-gray-700">+91 9950788973</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-purple-500" />
                <span className="text-gray-700">matajistudio@gmail.com</span>
              </div>
              <div className="flex items-start gap-3">
                <Camera className="w-5 h-5 text-purple-500 mt-0.5" />
                <span className="text-gray-700">Near IDBI Bank Opp. Railway Station High School Road, Barmer 344001</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MatajiStudio;