import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, MapPin, Star, CheckCircle, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import ReactGA from "react-ga4";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

const carouselImages = [
  {
    src: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
    alt: "Digital services center helping citizens",
  },
  {
    src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    alt: "Technology assistance and digital India",
  },
  {
    src: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80",
    alt: "Online documentation and government services",
  },
  {
    src: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=1200&q=80",
    alt: "Rural digital services and connectivity",
  },
  {
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    alt: "Digital help center and support",
  },
];

const Hero = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0c1524]">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12 lg:pt-0 lg:pb-0">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center"
        >
          {/* Left: Content */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8 order-1">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/15 border border-amber-400/25 backdrop-blur-sm">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300 font-medium text-sm">Government Authorized Center</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.15] tracking-tight">
              <span className="text-white">Reliable Digital Services</span>
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                at Your Fingertips
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-sm sm:text-base lg:text-lg xl:text-xl text-slate-300 leading-relaxed max-w-xl">
              Apply for certificates, government schemes, bill payments, and many other E-Mitra services quickly and securely — all at one place.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-black font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transform hover:scale-[1.03] transition-all duration-300 group text-sm sm:text-base px-5 sm:px-7 h-10 sm:h-11"
                onClick={() => {
                  ReactGA.event({ category: "engagement", action: "get_started_click", label: "hero_cta" });
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 font-semibold shadow-lg transform hover:scale-[1.03] transition-all duration-300 text-sm sm:text-base px-5 sm:px-7 h-10 sm:h-11"
                onClick={() => {
                  ReactGA.event({ category: "engagement", action: "explore_services_click", label: "hero_cta" });
                  document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Explore Services
              </Button>
            </motion.div>

            {/* Quick contact row */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-2 sm:gap-3 pt-1">
              <button
                onClick={() => { window.location.href = "tel:+919950788973"; }}
                className="flex items-center gap-1.5 sm:gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 transition-all duration-300 group"
              >
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                <span className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors">+91 9950788973</span>
              </button>
              <button
                onClick={() => { window.open("https://wa.me/919950788973", "_blank"); }}
                className="flex items-center gap-1.5 sm:gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 transition-all duration-300 group"
              >
                <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400" />
                <span className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors">WhatsApp</span>
              </button>
              <button
                onClick={() => { window.open("https://www.google.com/maps/dir/?api=1&destination=25.746793418531855,71.39670954386371", "_blank"); }}
                className="flex items-center gap-1.5 sm:gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 transition-all duration-300 group"
              >
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                <span className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors">Barmer</span>
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                Govt. Authorized
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                24/7 Support
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                Trusted by 1000+
              </span>
            </motion.div>
          </div>

          {/* Right: Carousel */}
          <motion.div variants={itemVariants} className="relative order-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10">
              {/* Gradient overlay on images */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10 pointer-events-none rounded-2xl" />

              <Swiper
                modules={[Autoplay, Pagination, Navigation, EffectFade]}
                effect="fade"
                autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                pagination={{ clickable: true, dynamicBullets: true }}
                navigation={{ nextEl: ".hero-swiper-next", prevEl: ".hero-swiper-prev" }}
                loop
                speed={800}
                className="hero-swiper aspect-[16/10] lg:aspect-[4/3] xl:aspect-[16/10]"
                lazyPreloadPrevNext={1}
              >
                {carouselImages.map((img, i) => (
                  <SwiperSlide key={i}>
                    <img
                      src={img.src}
                      alt={img.alt}
                      loading={i === 0 ? "eager" : "lazy"}
                      className="w-full h-full object-cover"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Custom navigation arrows */}
              <button className="hero-swiper-prev absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full p-2 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="hero-swiper-next absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full p-2 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Decorative glow behind carousel */}
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-emerald-500/10 rounded-3xl blur-2xl -z-10" />
          </motion.div>
        </motion.div>
      </div>

      {/* Custom Swiper styles */}
      <style>{`
        .hero-swiper .swiper-pagination-bullet {
          background: white;
          opacity: 0.5;
          width: 8px;
          height: 8px;
          transition: all 0.3s;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          background: #fbbf24;
          width: 24px;
          border-radius: 4px;
        }
        .hero-swiper .swiper-pagination {
          bottom: 12px !important;
        }
      `}</style>
    </section>
  );
};

export default Hero;
