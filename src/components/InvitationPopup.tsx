import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Sparkles, MapPin, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const InvitationPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if popup has been shown in this session
    const hasSeenPopup = sessionStorage.getItem("invitationPopupSeen");
    
    if (!hasSeenPopup) {
      // Show popup after a short delay for better UX
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem("invitationPopupSeen", "true");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-4 border-yellow-500 bg-gradient-to-br from-red-950 via-red-900 to-red-950 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-yellow-500 p-2 text-red-950 hover:bg-yellow-400 transition-all duration-300 hover:rotate-90"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Decorative Top Border */}
        <div className="h-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400" />

        {/* Content */}
        <div className="relative px-6 py-8 sm:px-10 sm:py-12">
          {/* Sparkle Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Sparkles className="h-16 w-16 text-yellow-400 animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-yellow-500 opacity-50 animate-pulse" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent animate-fade-in leading-tight">
            Grand Opening
          </h1>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-yellow-100 mb-6">
            Malani Mobile and Electronics
          </h2>

          {/* Subheading */}
          <div className="flex justify-center gap-2 flex-wrap mb-8">
            <span className="px-4 py-2 bg-yellow-500/20 border border-yellow-500 rounded-full text-yellow-200 text-sm font-semibold">
              E-Mitra Services
            </span>
            <span className="px-4 py-2 bg-yellow-500/20 border border-yellow-500 rounded-full text-yellow-200 text-sm font-semibold">
              Mataji Studio
            </span>
          </div>

          {/* Date & Time Section */}
          <div className="bg-red-900/50 border-2 border-yellow-500/50 rounded-lg p-6 mb-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-yellow-100">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-yellow-400" />
                <div>
                  <p className="text-sm text-yellow-300">Date</p>
                  <p className="font-bold text-lg">2nd October 2025</p>
                </div>
              </div>
              <div className="hidden sm:block h-12 w-px bg-yellow-500/50" />
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-yellow-400" />
                <div>
                  <p className="text-sm text-yellow-300">Time</p>
                  <p className="font-bold text-lg">11:00 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="flex items-start gap-3 mb-8 text-yellow-100">
            <MapPin className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm text-yellow-300 mb-1">Location</p>
              <p className="font-semibold text-base leading-relaxed">
                Near IDBI Bank, Opp. Railway Station,<br />
                High School Road, Barmer – 344001
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 text-red-950 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-500 font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Join the Celebration
            </Button>
          </div>

          {/* Decorative Bottom Text */}
          <p className="text-center text-yellow-300/80 text-sm mt-6 italic">
            Your presence will make this occasion more special!
          </p>
        </div>

        {/* Decorative Bottom Border */}
        <div className="h-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400" />
      </DialogContent>
    </Dialog>
  );
};

export default InvitationPopup;
