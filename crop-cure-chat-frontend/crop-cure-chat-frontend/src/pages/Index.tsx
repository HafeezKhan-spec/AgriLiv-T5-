import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, ArrowRight, Shield, Zap, Brain, Users } from "lucide-react";
import heroImage from "@/assets/hero-agriculture.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();
  const [diseaseCount, setDiseaseCount] = useState<number | null>(null);
  const [diseaseNames, setDiseaseNames] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchDiseases = async () => {
      try {
        const resp = await fetch('/api/model/diseases');
        const json = await resp.json();
        if (json && json.success && json.data) {
          const arr = Array.isArray(json.data.diseases) ? json.data.diseases : (Array.isArray(json.data) ? json.data : []);
          const count = typeof json.data.total === 'number' ? json.data.total : (Array.isArray(arr) ? arr.length : null);
          if (!cancelled) {
            setDiseaseCount(count);
            const names = arr.slice(0, 5).map((d: { name?: string } | string) => (typeof d === 'object' && d.name ? d.name : d));
            setDiseaseNames(names.filter(Boolean));
          }
          return;
        }
      } catch (_) {
        // fall through to details
      }

      try {
        const detailsResp = await fetch('/api/model/details');
        const detailsJson = await detailsResp.json();
        const models = detailsJson?.data?.models || [];
        const primary = models[0] || {};
        const supported = Array.isArray(primary.supportedDiseases) ? primary.supportedDiseases : [];
        if (!cancelled) {
          setDiseaseCount(supported.length || null);
          setDiseaseNames(supported.slice(0, 5));
        }
      } catch (_) {
        // ignore
      }
    };

    fetchDiseases();
    return () => { cancelled = true; };
  }, []);
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Modern agricultural technology" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4 animate-fade-in">
          <div className="mb-6">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-white/20">
              <Leaf className="h-6 w-6 text-accent" />
              <span className="text-lg font-semibold">AgriClip AI Platform</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="gradient-text bg-gradient-to-r from-white via-accent to-primary bg-clip-text text-transparent">
              {t('home.title')}
            </span>
            <br />
            <span className="text-white">{t('home.subtitle')}</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('home.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
  <Button 
    asChild 
    size="lg" 
    className="bg-gradient-primary hover:opacity-90 text-white border-0 px-8 py-6 text-lg animate-pulse-glow transition-colors duration-300"
  >
    <Link to="/signup" className="flex items-center gap-2">
      {t('home.getStarted')}
      <ArrowRight className="h-5 w-5" />
    </Link>
  </Button>

  <Button 
    asChild 
    size="lg" 
    className="bg-green-600 text-white border-0 px-8 py-6 text-lg transition-colors duration-300 hover:bg-white hover:text-green-600"
  >
    <Link to="/login">
      {t('home.signIn')}
    </Link>
  </Button>
</div>


          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="glass p-6 rounded-2xl">
              <div className="text-3xl font-bold text-accent mb-2">95%</div>
              <div className="text-white/80">Detection Accuracy</div>
            </div>
            <div className="glass p-6 rounded-2xl">
              <div className="text-3xl font-bold text-accent mb-2">{typeof diseaseCount === 'number' ? diseaseCount : '50+'}</div>
              <div className="text-white/80">Crop Diseases</div>
              {diseaseNames.length > 0 && (
                <div className="mt-2 text-xs text-white/70">
                  {diseaseNames.join(' • ')}
                </div>
              )}
            </div>
            <div className="glass p-6 rounded-2xl">
              <div className="text-3xl font-bold text-accent mb-2">24/7</div>
              <div className="text-white/80">AI Assistant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              {t('home.whyChoose')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('home.subtitle2')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="floating-card text-center animate-scale-in">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 rounded-2xl bg-gradient-primary w-fit">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">{t('home.aiPowered')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t('home.aiPoweredDesc')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="floating-card text-center animate-scale-in">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 rounded-2xl bg-gradient-secondary w-fit">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{t('home.instantResults')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t('home.instantResultsDesc')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="floating-card text-center animate-scale-in">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 rounded-2xl bg-gradient-primary w-fit">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">{t('home.expertGuidance')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t('home.expertGuidanceDesc')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="floating-card text-center animate-scale-in">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 rounded-2xl bg-gradient-secondary w-fit">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{t('home.communitySupport')}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t('home.communitySupportDesc')}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              {t('home.howItWorks')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('home.howItWorksDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4 animate-slide-up">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-semibold">{t('home.uploadImage')}</h3>
              <p className="text-muted-foreground">
                {t('home.uploadImageDesc')}
              </p>
            </div>

            <div className="text-center space-y-4 animate-slide-up">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-semibold">{t('home.aiAnalysis')}</h3>
              <p className="text-muted-foreground">
                {t('home.aiAnalysisDesc')}
              </p>
            </div>

            <div className="text-center space-y-4 animate-slide-up">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-semibold">{t('home.getResults')}</h3>
              <p className="text-muted-foreground">
                {t('home.getResultsDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('home.readyToProtect')}
            </h2>
            <p className="text-xl text-white/90 mb-8">
              {t('home.joinThousands')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="px-8 py-6 text-lg">
                <Link to="/signup">
                  {t('home.startFreeTrial')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white text-black border-0 px-8 py-6 text-lg transition-colors duration-300 hover:bg-black/100 hover:text-green-400">
                <Link to="/dashboard">
                  {t('home.viewDemo')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-primary">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">AgriClip</span>
              </div>
              <p className="text-muted-foreground">
                AI-powered agricultural disease detection for modern farming.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/features" className="hover:text-primary">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-primary">Pricing</Link></li>
                <li><Link to="/api" className="hover:text-primary">API</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/help" className="hover:text-primary">Help Center</Link></li>
                <li><Link to="/docs" className="hover:text-primary">Documentation</Link></li>
                <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary">About</Link></li>
                <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-primary">Careers</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 AgriClip. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
