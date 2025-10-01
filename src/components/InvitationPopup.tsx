import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Sparkles, MapPin, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-4 border-yellow-500 bg-gradient-to-br from-red-950 via-red-900 to-red-950 shadow-2xl animate-fade-in">
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
        <div className="relative px-4 py-6 sm:px-10 sm:py-12 animate-slide-in-from-bottom">
          {/* Logo Section */}
          <div className="flex justify-center mb-6 animate-scale-in">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-yellow-500 opacity-40 animate-pulse" />
              <img 
                src="/logo3.png" 
                alt="Malani Mobile Logo" 
                className="relative h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-full border-4 border-yellow-400 shadow-2xl shadow-yellow-500/50 bg-white/10 backdrop-blur-sm p-2"
              />
            </div>
          </div>

          {/* Sparkle Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Sparkles className="h-12 w-12 sm:h-14 sm:w-14 text-yellow-400 animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-yellow-500 opacity-50 animate-pulse" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-center mb-3 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent animate-fade-in leading-tight drop-shadow-2xl">
            Grand Opening
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
          <div className="bg-red-900/50 border-2 border-yellow-500/50 rounded-xl p-4 sm:p-6 mb-6 backdrop-blur-sm shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-yellow-100">
              <div className="flex items-center gap-3 justify-center sm:justify-start bg-red-950/30 p-3 rounded-lg">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 flex-shrink-0" />
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-yellow-300 mb-0.5">Date</p>
                  <p className="font-bold text-base sm:text-lg whitespace-nowrap">2nd October 2025</p>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center sm:justify-start bg-red-950/30 p-3 rounded-lg">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 flex-shrink-0" />
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-yellow-300 mb-0.5">Time</p>
                  <p className="font-bold text-base sm:text-lg">11:00 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="flex items-start gap-3 mb-8 text-yellow-100 bg-red-950/30 p-4 rounded-lg border border-yellow-500/30">
            <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-xs sm:text-sm text-yellow-300 mb-1 font-semibold">Location</p>
              <p className="font-semibold text-sm sm:text-base leading-relaxed">
                Near IDBI Bank, Opp. Railway Station,<br />
                High School Road, Barmer – 344001
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
