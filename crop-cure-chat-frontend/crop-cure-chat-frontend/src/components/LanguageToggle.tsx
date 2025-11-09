import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'te' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="rounded-full"
      title={language === 'en' ? 'Switch to Telugu' : 'Switch to English'}
    >
      <Languages className="h-4 w-4" />
      <span className="ml-1 text-xs font-medium">
        {language === 'en' ? 'EN' : 'తె'}
      </span>
    </Button>
  );
};

export default LanguageToggle;
