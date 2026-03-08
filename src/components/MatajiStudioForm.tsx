import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import emailjs from "emailjs-com"; // ✅ or switch to '@emailjs/browser'
import ReactGA from "react-ga4";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar, Send, Loader2 } from "lucide-react";

// ✅ Define the form data type
type BookingFormData = {
  name: string;
  phone: string;
  email: string;
  sessionType: string;
  date: string;
  message?: string;
};

export default function BookingForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>();

  const [loading, setLoading] = useState(false);

  const service_id = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const template_id = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_MATAJI_STUDIO;
  const public_key = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const onSubmit = async (data: BookingFormData) => {
    setLoading(true);
    emailjs
      .send(service_id, template_id, data, public_key)
      .then(() => {
        toast.success("Booking request sent successfully!");
        reset();
      })
      .catch((error) => {
        console.error("❌ EmailJS error:", error);
        toast.error("Failed to send booking request. Please try again after some time.");
        reset();
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => ReactGA.event({ category: 'engagement', action: 'book_photo_session_click', label: 'book_photo_session' })}
        >
          <Calendar className="w-5 h-5 mr-2" />
          Book a Photo Session
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Book Your Session
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="10-digit phone number"
              {...register("phone", { required: "Phone number is required", pattern: { value: /^[0-9]{10}$/, message: "Enter a valid 10-digit number" } })}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-type">Session Type</Label>
            <select
              id="session-type"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              {...register("sessionType", {
                required: "Session type is required",
              })}
            >
              <option value="">Select a session</option>
              <option>Wedding Photography</option>
              <option>Portrait Session</option>
              <option>Event Coverage</option>
              <option>Family Photos</option>
            </select>
            {errors.sessionType && (
              <p className="text-red-500 text-sm">
                {errors.sessionType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Preferred Date</Label>
            <Input
              id="date"
              type="date"
              {...register("date", { required: "Date is required" })}
            />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional Details</Label>
            <Textarea
              id="message"
              placeholder="Tell us about your photography needs..."
              {...register("message")}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Booking Request
              </>
            )}
          </Button>
        </form>

      </DialogContent>
    </Dialog>
  );
}
