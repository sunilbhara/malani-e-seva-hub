import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, MapPin, BookOpen, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, role } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const isBlogSurface =
    /^\/blog(\/|$)/.test(location.pathname) ||
    location.pathname === "/admin" ||
    location.pathname === "/login";

  const headerSolid = isBlogSurface || isScrolled;

  useEffect(() => {
    if (isBlogSurface) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isBlogSurface]);

  const navItems = [
    { name: "Home", href: "#home" },
    { name: "E-Mitra Services", href: "#services" },
    { name: "Mobile & Electronics", href: "#mobile-electronics" },
    { name: "Mataji Studio", href: "#mataji-studio" },
    { name: "Location", href: "#location" },
    { name: "Contact", href: "#contact" },
  ];

  const scrollToSection = (href: string) => {
    const sectionId = href.replace("#", "");

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      const element = document.getElementById(sectionId);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    }

    setIsOpen(false);
  };

  const linkClass = `font-semibold transition-colors relative group ${
    headerSolid ? "text-gray-900 hover:text-yellow-600" : "text-white hover:text-yellow-300"
  }`;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        headerSolid ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50" : "bg-black/20 backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex cursor-pointer items-center space-x-3"
            onClick={() => navigate("/")}
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg">
              <img src="/logo.jpeg" alt="Malani Barmer Logo" className="h-full w-full object-contain p-1" />
            </div>

            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-[#ef4444] via-[#b45309] to-[#f59e0b] bg-clip-text text-transparent">
                Malani Barmer
              </h1>
              <p className={`text-xs ${headerSolid ? "text-gray-600" : "text-white/90"}`}>Complete Solutions Hub</p>
            </div>
          </motion.div>

          <div className="hidden items-center space-x-6 lg:flex">
            {navItems.map((item, index) => (
              <motion.button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className={linkClass}
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                {item.name}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 w-0 ${
                    headerSolid ? "bg-yellow-600" : "bg-yellow-400"
                  } transition-all duration-300 group-hover:w-full`}
                />
              </motion.button>
            ))}
            <Link
              to="/blog"
              className={`relative ${linkClass} flex items-center gap-1.5`}
              onMouseDown={() => setIsOpen(false)}
            >
              <BookOpen className="h-4 w-4" />
              Blog
              <span
                className={`absolute bottom-0 left-0 h-0.5 w-0 ${
                  headerSolid ? "bg-yellow-600" : "bg-yellow-400"
                } transition-all duration-300 group-hover:w-full`}
              />
            </Link>
          </div>

          <div className="hidden items-center space-x-3 lg:flex">
            {role === "admin" && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  headerSolid
                    ? "border-amber-200 bg-amber-50/80 text-amber-900 hover:bg-amber-100"
                    : "border-white/35 bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Admin
              </Link>
            )}
            {user ? (
              <button
                type="button"
                onClick={() => logout()}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  headerSolid
                    ? "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                    : "border-white/35 bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  headerSolid
                    ? "border-amber-200 bg-gradient-to-r from-[#ef4444] via-[#b45309] to-[#f59e0b] text-white shadow-md hover:opacity-95"
                    : "border-yellow-300/60 bg-yellow-400/20 text-white hover:bg-yellow-400/30"
                }`}
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}

            {/* <motion.div
              whileHover={{ scale: 1.05 }}
              className={`flex items-center space-x-2 rounded-lg border px-3 py-1.5 text-sm backdrop-blur-sm ${
                headerSolid ? "border-gray-200 bg-gray-50" : "border-white/30 bg-white/20"
              }`}
            >
              <Phone className="h-4 w-4 text-yellow-500" />
              <span className={`font-medium ${headerSolid ? "text-gray-900" : "text-white"}`}>+91 9950788973</span>
            </motion.div> */}

            {/* <motion.div
              whileHover={{ scale: 1.05 }}
              className={`flex items-center space-x-2 rounded-lg border px-3 py-1.5 text-sm backdrop-blur-sm ${
                headerSolid ? "border-gray-200 bg-gray-50" : "border-white/30 bg-white/20"
              }`}
            >
              <MapPin className="h-4 w-4 text-yellow-500" />
              <span className={`font-medium ${headerSolid ? "text-gray-900" : "text-white"}`}>Barmer</span>
            </motion.div> */}
          </div>

          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className={`rounded-lg border p-2 shadow-lg backdrop-blur-sm lg:hidden ${
              headerSolid ? "border-black/20 bg-black/10" : "border-white/40 bg-white/20"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                  <X className={`h-6 w-6 ${headerSolid ? "text-black" : "text-white"}`} />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                  <Menu className={`h-6 w-6 ${headerSolid ? "text-black" : "text-white"}`} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200/50 bg-white/95 backdrop-blur-md lg:hidden"
          >
            <div className="container mx-auto space-y-2 px-4 py-6">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full rounded-lg px-4 py-3 text-left font-semibold text-gray-800 hover:bg-amber-50 hover:text-amber-800"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  {item.name}
                </motion.button>
              ))}
              <Link
                to="/blog"
                className="flex items-center gap-2 rounded-lg px-4 py-3 font-semibold text-gray-800 hover:bg-amber-50 hover:text-amber-800"
                onClick={() => setIsOpen(false)}
              >
                <BookOpen className="h-4 w-4" />
                Blog
              </Link>
              {role === "admin" && (
                <Link to="/admin" className="block rounded-lg px-4 py-3 font-semibold text-gray-800 hover:bg-amber-50" onClick={() => setIsOpen(false)}>
                  Admin
                </Link>
              )}
              {user ? (
                <button type="button" className="block w-full rounded-lg px-4 py-3 text-left font-semibold text-gray-800 hover:bg-gray-50" onClick={() => logout()}>
                  Logout
                </button>
              ) : (
                <Link to="/login" className="block rounded-lg px-4 py-3 font-semibold text-amber-800 hover:bg-amber-50" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
              )}

              <div className="space-y-3 border-t border-gray-200/50 pt-4">
                <div className="flex items-center space-x-3 text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4 text-amber-600" />
                  <span>+91 9950788973</span>
                </div>
                <div className="flex items-center space-x-3 text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <span>Near IDBI Bank, Barmer</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navigation;
