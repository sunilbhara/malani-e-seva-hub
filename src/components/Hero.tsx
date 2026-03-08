import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Phone,
  MapPin,
  Star,
  CheckCircle,
  MessageCircle,
} from "lucide-react";

import { motion } from "framer-motion";
import ReactGA from "react-ga4";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-fade";

const carouselImages = [
  {
    src: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80",
  },
  {
    src: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80",
  },
  {
    src: "https://res.cloudinary.com/duovfafmc/image/upload/v1772977318/Gemini_Generated_Image_77s7lx77s7lx77s7_q6n3ez.png",
  },
  {
    src: "https://res.cloudinary.com/duovfafmc/image/upload/v1772977335/photo_2026-03-08_19-11-37_ywu0f9.jpg",
  },
];



const Hero = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden text-white">

      {/* BACKGROUND CAROUSEL */}

      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        autoplay={{ delay: 5000 }}
        speed={2000}
        loop
        className="absolute inset-0 h-full w-full"
      >
        {carouselImages.map((img, i) => (
          <SwiperSlide key={i}>
            <img
              src={img.src}
              className="w-full h-full object-cover animate-kenburns"
              alt="hero"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* CINEMATIC DARK OVERLAY */}

      <div className="absolute inset-0 z-10">
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>
      </div>

      {/* GRADIENT MESH BACKGROUND */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <motion.div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity }}
        />

        <motion.div
          className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-yellow-400/20 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* HERO CONTENT */}

      <div className="relative z-20 flex items-center justify-center h-full px-6 text-center">

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl space-y-8"
        >

          {/* BADGE */}

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/20 backdrop-blur-md rounded-full border border-yellow-400/30">
            <Star className="h-4 w-4 text-yellow-300" />
            Authorized E-Mitra Center
          </div>

          {/* TITLE */}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight">

            <span className="text-white">
              Malani
            </span>

            {" "}

            <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
              Barmer
            </span>

          </h1>

          {/* SUBTITLE */}

          <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto">
            E-Mitra services, mobile electronics & professional photography —
            all in one trusted place.
          </p>

          {/* CTA */}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <Button
              size="lg"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold shadow-xl hover:scale-105 transition"
              onClick={() => {
                ReactGA.event({
                  category: "engagement",
                  action: "get_started_today_click",
                });

                document
                  .getElementById("contact")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              size="lg"
              className="bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 text-white"
              onClick={() =>
                document
                  .getElementById("services")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Services
            </Button>

          </div>

          {/* QUICK CONTACT */}

          <div className="flex flex-wrap justify-center gap-4 pt-4">

            <a
              href="tel:+919950788973"
              className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 hover:bg-white/20 transition"
            >
              <Phone size={16} />
              +91 9950788973
            </a>

            <a
              href="https://wa.me/919950788973"
              className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 hover:bg-white/20 transition"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>

            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md border border-white/20">
              <MapPin size={16} />
              Barmer
            </div>

          </div>

          {/* TRUST BADGES */}

          <div className="flex justify-center gap-6 pt-2 text-sm text-gray-300">

            <span className="flex items-center gap-1">
              <CheckCircle className="text-green-400" size={16} />
              Govt Authorized
            </span>

            <span className="flex items-center gap-1">
              <CheckCircle className="text-green-400" size={16} />
              24/7 Support
            </span>

          </div>

        </motion.div>

      </div>

      {/* FLOATING SERVICE CARDS */}

      <div className="hidden lg:block z-20">

        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="absolute left-[10%] top-[65%] bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20"
        >
          📄 Document Services
        </motion.div>

        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 5 }}
          className="absolute right-[12%] top-[60%] bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20"
        >
          📱 Mobile Electronics
        </motion.div>

        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 6 }}
          className="absolute right-[25%] top-[75%] bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20"
        >
          📷 Mataji Studio
        </motion.div>

      </div>

      {/* SCROLL INDICATOR */}

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/80 text-sm flex flex-col items-center gap-2 animate-bounce z-20">
        <span>Scroll</span>
        ↓
      </div>

    </section>
  );
};

export default Hero;