import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Menu, 
  Leaf, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  Settings 
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "./LanguageToggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const { t } = useLanguage();
  
  // Mock authentication state - replace with actual auth context
  const isAuthenticated = localStorage.getItem("authToken") !== null;
  const userName = localStorage.getItem("userName") || "User";

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    toast({
      title: t('toast.loggedOut'),
      description: t('toast.loggedOutDesc'),
    });
    navigate("/");
  };

  const navigation = [
    { name: t('nav.home'), href: "/" },
    { name: t('nav.dashboard'), href: "/dashboard", requiresAuth: true },
    { name: t('nav.profile'), href: "/profile", requiresAuth: true },
  ];

  const filteredNavigation = navigation.filter(
    item => !item.requiresAuth || isAuthenticated
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 rounded-xl bg-gradient-primary shadow-glow group-hover:shadow-lg transition-all">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              AgriClip
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.href 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <LanguageToggle />
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-full"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    {t('nav.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('nav.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">{t('nav.login')}</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">{t('nav.getStarted')}</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="mt-6 flow-root">
                  <div className="space-y-2">
                    {filteredNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                          location.pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                    
                    {!isAuthenticated && (
                      <div className="pt-4 space-y-2">
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link to="/login" onClick={() => setIsOpen(false)}>
                            {t('nav.login')}
                          </Link>
                        </Button>
                        <Button className="w-full" asChild>
                          <Link to="/signup" onClick={() => setIsOpen(false)}>
                            {t('nav.getStarted')}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;