import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const EmailOtpLoginModal = ({ open, onOpenChange }: Props) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.data?.otpPending) {
        setOtpStep(true);
        // Ensure identifier is set to email returned from server (normalized)
        if (data.data?.email) {
          setIdentifier(data.data.email);
        }
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
        body: JSON.stringify({ email: identifier, code: otpCode }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('userName', data.data.user.username);
        toast({ title: t('toast.loginSuccess'), description: t('toast.welcomeBack') });
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('login.signIn')}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (otpStep) {
              handleVerifyOtp();
            } else {
              handleLogin();
            }
          }}
          className="space-y-4"
        >
          {!otpStep && (
            <>
              <div className="space-y-2">
                <Label htmlFor="identifier">{t('login.email') || 'Email or Username'}</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="farmer@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

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
                className="tracking-widest"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {otpStep ? (t('login.verifying') || 'Verifying') : t('login.signingIn')}
              </>
            ) : (
              otpStep ? (t('login.verifyOtp') || 'Verify Code') : t('login.signIn')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmailOtpLoginModal;