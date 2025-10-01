import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Sparkles, MapPin, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaMapMarkerAlt, FaUserFriends } from "react-icons/fa";
import { MdDateRange, MdAccessTime } from "react-icons/md";
import { GiPartyPopper } from "react-icons/gi";
import { BsStars } from "react-icons/bs";

const InvitationPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show popup after a short delay for better UX
    const timer = setTimeout(() => {
      setOpen(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="
          max-w-[95vw]
          w-full
          sm:max-w-2xl
          lg:max-w-[50vw]
          p-0
          overflow-hidden
          border-4
          border-yellow-500
          bg-gradient-to-br
          from-red-950
          via-red-900
          to-red-950
          shadow-2xl
          animate-fade-in
          max-h-[95vh]
          flex
          flex-col
        "
        style={{
          // maxWidth: '50vw',
          maxHeight: '95vh',
          width: '100%',
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-yellow-500 p-2 text-red-950 hover:bg-yellow-400 transition-all duration-300 hover:rotate-90 shadow-lg"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Decorative Top Border with Animation */}
        <div className="h-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 animate-pulse" />

        {/* Content */}
        <div
          className="
            relative
            px-2 py-4
            sm:px-8 sm:py-10
            animate-slide-in-from-bottom
            overflow-y-auto
            flex-1
            scrollbar-hide
          "
          style={{
            maxHeight: 'calc(95vh - 48px)', // 48px for top+bottom border
          }}
        >
          {/* Logo Section */}
          <div className="flex justify-center mb-6 animate-scale-in">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-yellow-500 opacity-40 animate-pulse" />
              <img
                src="/logo4.png"
                alt="Malani Mobile Logo"
                className="relative h-28 w-28 sm:h-24 sm:w-24 object-contain rounded-full border-4 border-yellow-400 shadow-2xl shadow-yellow-500/50 bg-white/10 backdrop-blur-sm p-2"
              />
            </div>
          </div>


          {/* Main Heading */}
          <h1
            className="text-2xl sm:text-4xl md:text-5xl font-bold text-center mb-3 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent animate-fade-in leading-tight drop-shadow-2xl pb-2 align-middle flex items-center justify-center gap-2"
            style={{
              lineHeight: 1.2,
              paddingBottom: "0.25em",
            }}
          >
            <GiPartyPopper className="inline-block text-yellow-400 drop-shadow-lg animate-bounce" size={36} />
            Grand Opening
            <BsStars className="inline-block text-yellow-300 drop-shadow-lg animate-spin-slow" size={28} />
          </h1>
          
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-yellow-100 mb-6 drop-shadow-lg">
            Malani Mobile and Electronics
          </h2>

          {/* Subheading */}
          <div className="flex justify-center gap-2 flex-wrap mb-8">
            <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-500/20 border-2 border-yellow-500 rounded-full text-yellow-200 text-xs sm:text-sm font-semibold shadow-lg hover:bg-yellow-500/30 transition-all">
              E-Mitra Services
            </span>
            <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-500/20 border-2 border-yellow-500 rounded-full text-yellow-200 text-xs sm:text-sm font-semibold shadow-lg hover:bg-yellow-500/30 transition-all">
              Mataji Studio
            </span>
          </div>

          {/* Date & Time Section - Improved Mobile Layout */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-4 bg-gradient-to-r from-yellow-900/60 via-red-900/80 to-yellow-900/60 border-2 border-yellow-500/50 rounded-xl px-6 py-4 shadow-xl backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-yellow-400 animate-pulse" />
                <span className="text-yellow-100 font-bold text-base sm:text-lg">
                  2nd October 2025
                </span>
              </span>
              <span className="text-yellow-400 font-bold text-xl">|</span>
              <span className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-yellow-400 animate-pulse" />
                <span className="text-yellow-100 font-bold text-base sm:text-lg">
                  11:00 AM
                </span>
              </span>
            </div>
          </div>

          {/* Address Section */}
          <div className="flex items-start gap-4 mb-8 bg-gradient-to-r from-yellow-900/60 via-red-900/80 to-yellow-900/60 p-5 rounded-xl border-2 border-yellow-500/40 shadow-lg">
            <div className="flex flex-col items-center justify-center mr-2">
              <FaMapMarkerAlt className="h-8 w-8 text-yellow-400 mb-2 animate-bounce" />
              <span className="text-yellow-300 text-xs font-semibold uppercase tracking-widest">Venue</span>
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-yellow-200 mb-2 flex items-center gap-2">
                <BsStars className="text-yellow-400 animate-pulse" />
                स्थल / Location
                <BsStars className="text-yellow-400 animate-pulse" />
              </p>
              <address className="not-italic text-yellow-100 font-semibold text-base sm:text-lg leading-relaxed">
                Near IDBI Bank, Opp. Railway Station,<br />
                High School Road, Barmer – 344001
              </address>
              <a
                href="https://maps.app.goo.gl/ZzkAbVAZRGT61f4u7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-yellow-300 hover:text-yellow-400 text-xs sm:text-sm font-semibold underline transition-colors"
              >
                <FaMapMarkerAlt className="h-4 w-4" />
                View on Google Maps
              </a>
            </div>
          </div>

          <div className="mb-8 bg-gradient-to-r from-yellow-900/60 via-red-900/80 to-yellow-900/60 p-5 rounded-xl border-2 border-yellow-500/40 flex items-start gap-4 shadow-lg">
            <div className="flex flex-col items-center justify-center mr-2">
              <FaUserFriends className="h-8 w-8 text-yellow-400 mb-2 animate-pulse" />
              <span className="text-yellow-300 text-xs font-semibold uppercase tracking-widest">Invitees</span>
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-yellow-200 mb-2 flex items-center gap-2">
                सादर आमंत्रण <BsStars className="text-yellow-400 animate-spin-slow" />
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-yellow-100 font-semibold text-base sm:text-lg">
                  <span className="text-yellow-400"><BsStars /></span>
                  तरुण भारती s/o श्री अमर भारती जी गोस्वामी
                </li>
              </ul>
              <p className="mt-3 text-xs sm:text-sm text-yellow-300 italic">
                We respectfully invite you to grace the occasion with your presence.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 text-red-950 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-500 font-bold text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 rounded-full shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105 border-2 border-yellow-600"
            >
              <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Join the Celebration
            </Button>
          </div>

          {/* Decorative Bottom Text */}
          <p className="text-center text-yellow-300/80 text-xs sm:text-sm mt-6 italic font-medium">
            ✨ Your presence will make this occasion more special! ✨
          </p>
        </div>

        {/* Decorative Bottom Border with Animation */}
        <div className="h-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 animate-pulse" />
      </DialogContent>
    </Dialog>
  );
};

export default InvitationPopup;