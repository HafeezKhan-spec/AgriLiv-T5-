import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Leaf, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import EmailOtpLoginModal from "@/components/EmailOtpLoginModal";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleGoogleSignIn = () => {
    // Open the email/password + OTP login modal instead of Google OAuth
    setLoginModalOpen(true);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.data?.otpPending) {
        setOtpStep(true);
        toast({ title: t('toast.loginSuccess'), description: t('toast.checkEmailForOtp') });
      } else {
        toast({
          title: t('toast.loginFailed'),
          description: data.message || t('toast.checkCredentials'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: t('toast.loginFailed'), description: t('toast.serverError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({ title: t('toast.invalidOtp'), description: t('toast.enterSixDigitCode'), variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('userName', data.data.user.username);
        toast({ title: t('toast.loginSuccess'), description: t('toast.welcomeBack') });
        navigate('/dashboard');
      } else {
        toast({
          title: t('toast.otpFailed') || 'Verification failed',
          description: data.message || t('toast.invalidOtp'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast({ title: t('toast.otpFailed') || 'Verification failed', description: t('toast.serverError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow animate-float">
              <Leaf className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text">{t('login.welcomeBack')}</h1>
          <p className="text-muted-foreground">
            {t('login.signInToContinue')}
          </p>
        </div>

        <Card className="floating-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t('login.signIn')}</CardTitle>
            <CardDescription className="text-center">
              {t('login.enterCredentials')}
            </CardDescription>
          </CardHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (otpStep) {
                handleVerifyOtp();
              } else {
                handleLogin();
              }
            }}
          >
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="farmer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all focus:ring-2 focus:ring-primary"
                  
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('login.password')}</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 transition-all focus:ring-2 focus:ring-primary"
                    
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {otpStep && (
                <div className="space-y-2">
                  <Label htmlFor="otp">{t('login.otpCode') || 'Verification Code'}</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="transition-all focus:ring-2 focus:ring-primary tracking-widest"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {otpStep ? (t('login.verifying') || 'Verifying') : t('login.signingIn')}
                  </>
                ) : (
                  otpStep ? (t('login.verifyOtp') || 'Verify Code') : t('login.signIn')
                )}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('login.orContinueWith')}
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full" type="button" disabled={isLoading} onClick={handleGoogleSignIn}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('login.signInWithGoogle')}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t('login.dontHaveAccount')}{" "}
                <Link
                  to="/signup"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  {t('login.signUpHere')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
        {/* Email/Password + OTP login modal (triggered by Google button) */}
        <EmailOtpLoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
      </div>
    </div>
  );
};

export default Login;