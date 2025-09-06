import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import emailjs from 'emailjs-com';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

type FormData = {
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
};

const ContactForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>();

  const [loading, setLoading] = useState(false);

  const service_id = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const template_id = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const public_key = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const onSubmit = (data: FormData) => {
    setLoading(true);
    emailjs
      .send(service_id, template_id, data, public_key)
      .then(() => {
        toast.success(' Message sent successfully!');
        reset();
      })
      .catch((error) => {
        console.error('❌ EmailJS error:', error);
        toast.error('Something went wrong. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
          <CardHeader className="relative">
            <CardTitle className="text-2xl lg:text-3xl text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
              Send us a Message
            </CardTitle>
            <p className="text-center text-gray-600 mt-2 text-sm lg:text-base">
              We'll get back to you within 24 hours
            </p>
          </CardHeader>
          <CardContent className="space-y-4 lg:space-y-6 relative">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="Your Name"
                  {...register('name', { required: 'Name is required' })}
                  className="h-12 lg:h-14 border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Input
                  placeholder="Phone Number"
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Enter a valid 10-digit number'
                    }
                  })}
                  className="h-12 lg:h-14 border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <Input
                placeholder="Email Address"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Enter a valid email'
                  }
                })}
                className="h-12 lg:h-14 border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Input
                placeholder="Service Required"
                {...register('service', { required: 'Service is required' })}
                className="h-12 lg:h-14 border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
              />
              {errors.service && <p className="text-red-500 text-sm mt-1">{errors.service.message}</p>}
            </div>

            <div>
              <Textarea
                placeholder="Your Message"
                rows={4}
                {...register('message', { required: 'Message is required' })}
                className="border-2 border-gray-200 focus:border-blue-500 transition-colors bg-white/80 backdrop-blur-sm"
              />
              {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 h-12 lg:h-14 text-base lg:text-lg font-bold shadow-xl transform hover:scale-105 transition-all duration-300 group flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Send className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                )}
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </form>
      {/* <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} /> */}
    </motion.div>
  );
};

export default ContactForm;
