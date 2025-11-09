import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'te';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.login': 'Login',
    'nav.getStarted': 'Get Started',
    'nav.logout': 'Logout',
    'nav.settings': 'Settings',
    
    // Common
    'common.welcome': 'Welcome',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.close': 'Close',
    'common.submit': 'Submit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    
    // Home page
    'home.title': 'Detect Crop Diseases',
    'home.subtitle': 'with AI Precision',
    'home.description': 'Upload crop images and get instant AI-powered disease detection, treatment recommendations, and expert agricultural guidance to protect your harvest.',
    'home.getStarted': 'Get Started Free',
    'home.signIn': 'Sign In',
    'home.whyChoose': 'Why Choose AgriClip?',
    'home.subtitle2': 'Advanced AI technology meets practical farming solutions for modern agriculture',
    'home.aiPowered': 'AI-Powered Detection',
    'home.aiPoweredDesc': 'Advanced deep learning models trained on thousands of crop images for accurate disease identification',
    'home.instantResults': 'Instant Results',
    'home.instantResultsDesc': 'Get disease detection results in seconds with confidence scores and treatment recommendations',
    'home.expertGuidance': 'Expert Guidance',
    'home.expertGuidanceDesc': '24/7 AI assistant provides farming advice, treatment plans, and preventive measures',
    'home.communitySupport': 'Community Support',
    'home.communitySupportDesc': 'Connect with fellow farmers and agricultural experts for shared knowledge and support',
    'home.howItWorks': 'How AgriClip Works',
    'home.howItWorksDesc': 'Simple, fast, and accurate crop disease detection in three easy steps',
    'home.uploadImage': 'Upload Image',
    'home.uploadImageDesc': 'Take a photo or upload an image of your crop using our intuitive interface',
    'home.aiAnalysis': 'AI Analysis',
    'home.aiAnalysisDesc': 'Our AI analyzes the image using advanced machine learning algorithms',
    'home.getResults': 'Get Results',
    'home.getResultsDesc': 'Receive instant diagnosis, treatment recommendations, and expert advice',
    'home.readyToProtect': 'Ready to Protect Your Crops?',
    'home.joinThousands': 'Join thousands of farmers worldwide who trust AgriClip for crop health management',
    'home.startFreeTrial': 'Start Free Trial',
    'home.viewDemo': 'View Demo',
    
    // Login page
    'login.welcomeBack': 'Welcome Back',
    'login.signInToContinue': 'Sign in to continue to AgriClip',
    'login.signIn': 'Sign In',
    'login.enterCredentials': 'Enter your email and password to access your account',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.forgotPassword': 'Forgot password?',
    'login.signingIn': 'Signing in...',
    'login.orContinueWith': 'or continue with',
    'login.signInWithGoogle': 'Sign in with Google',
    'login.dontHaveAccount': "Don't have an account?",
    'login.signUpHere': 'Sign up here',
    
    // Dashboard
    'dashboard.title': 'AgriClip Dashboard',
    'dashboard.subtitle': 'AI-powered crop disease detection and agricultural assistance',
    'dashboard.cropAnalysis': 'Crop Analysis',
    'dashboard.dropImage': 'Drop your crop image here',
    'dashboard.clickToBrowse': 'or click to browse files',
    'dashboard.supportedFormats': 'Supports: JPG, PNG, WebP (Max 10MB)',
    'dashboard.browseFiles': 'Browse Files',
    'dashboard.takePhoto': 'Take Photo',
    'dashboard.recentUploads': 'Recent Uploads',
    'dashboard.noUploadsYet': 'No uploads yet',
    'dashboard.aiAssistant': 'AI Assistant',
    'dashboard.askAboutCrops': 'Ask about crop diseases, farming techniques, or upload an image...',
    'dashboard.uploadingAndAnalyzing': 'Uploading and analyzing...',
    'dashboard.aiIsTyping': 'AI is typing...',
    'dashboard.chatCleared': 'Chat cleared! How can I help you today?',
    
    // Profile
    'profile.title': 'Profile',
    'profile.subtitle': 'Manage your account and view your AgriClip activity',
    'profile.verifiedFarmer': 'Verified Farmer',
    'profile.farmSize': 'Farm Size',
    'profile.primaryCrops': 'Primary Crops',
    'profile.activityStats': 'Activity Stats',
    'profile.totalAnalyses': 'Total Analyses',
    'profile.healthyCrops': 'Healthy Crops',
    'profile.issuesFound': 'Issues Found',
    'profile.chatSessions': 'Chat Sessions',
    'profile.profileSettings': 'Profile Settings',
    'profile.activityHistory': 'Activity History',
    'profile.personalInformation': 'Personal Information',
    'profile.updateProfileDetails': 'Update your profile details and preferences',
    'profile.fullName': 'Full Name',
    'profile.bio': 'Bio',
    'profile.phoneNumber': 'Phone Number',
    'profile.location': 'Location',
    'profile.recentAnalyses': 'Your recent AgriClip analyses and conversations',
    'profile.saveChanges': 'Save Changes',
    
    // Toast messages
    'toast.loginSuccess': 'Login successful!',
    'toast.welcomeBack': 'Welcome back to AgriClip',
    'toast.loginFailed': 'Login failed',
    'toast.checkCredentials': 'Please check your credentials',
    'toast.loggedOut': 'Logged out successfully',
    'toast.loggedOutDesc': 'You have been logged out of AgriClip',
    'toast.profileUpdated': 'Profile updated',
    'toast.profileUpdatedDesc': 'Your profile has been successfully updated.',
    'toast.chatCleared': 'Chat cleared',
    'toast.chatClearedDesc': 'All messages have been removed',
    'toast.imageUploaded': 'Image uploaded successfully',
    'toast.analysisInProgress': 'AI analysis in progress...',
    'toast.invalidFileType': 'Invalid file type',
    'toast.uploadImageFile': 'Please upload an image file (JPG, PNG, etc.)',
  },
  te: {
    // Navigation
    'nav.home': 'ముఖ్యపేజి',
    'nav.dashboard': 'డ్యాష్‌బోర్డ్',
    'nav.profile': 'ప్రొఫైల్',
    'nav.login': 'లాగిన్',
    'nav.getStarted': 'ప్రారంభించండి',
    'nav.logout': 'లాగ్‌అవుట్',
    'nav.settings': 'సెట్టింగ్‌లు',
    
    // Common
    'common.welcome': 'స్వాగతం',
    'common.loading': 'లోడ్ అవుతోంది...',
    'common.error': 'లోపం',
    'common.success': 'విజయం',
    'common.cancel': 'రద్దు చేయి',
    'common.save': 'సేవ్ చేయి',
    'common.edit': 'సవరించు',
    'common.delete': 'తొలగించు',
    'common.close': 'మూసివేయి',
    'common.submit': 'సమర్పించు',
    'common.back': 'వెనుకకు',
    'common.next': 'తదుపరి',
    'common.previous': 'మునుపటి',
    'common.yes': 'అవును',
    'common.no': 'కాదు',
    'common.ok': 'సరే',
    
    // Home page
    'home.title': 'పంట వ్యాధులను గుర్తించండి',
    'home.subtitle': 'AI ఖచ్చితత్వంతో',
    'home.description': 'పంట చిత్రాలను అప్‌లోడ్ చేసి తక్షణ AI-ఆధారిత వ్యాధి గుర్తింపు, చికిత్సా సిఫార్సులు మరియు మీ పంటను రక్షించడానికి నిపుణ వ్యవసాయ మార్గదర్శకత్వాన్ని పొందండి.',
    'home.getStarted': 'ఉచితంగా ప్రారంభించండి',
    'home.signIn': 'సైన్ ఇన్',
    'home.whyChoose': 'ఎందుకు AgriClip ని ఎంచుకోవాలి?',
    'home.subtitle2': 'ఆధునిక వ్యవసాయానికి అధునాతన AI సాంకేతికత ఆచరణాత్మక వ్యవసాయ పరిష్కారాలను కలుస్తుంది',
    'home.aiPowered': 'AI-ఆధారిత గుర్తింపు',
    'home.aiPoweredDesc': 'ఖచ్చితమైన వ్యాధి గుర్తింపు కోసం వేలాది పంట చిత్రాలపై శిక్షణ పొందిన అధునాతన డీప్ లెర్నింగ్ మోడల్‌లు',
    'home.instantResults': 'తక్షణ ఫలితాలు',
    'home.instantResultsDesc': 'విశ్వసనీయత స్కోర్‌లు మరియు చికిత్సా సిఫార్సులతో సెకన్లలో వ్యాధి గుర్తింపు ఫలితాలను పొందండి',
    'home.expertGuidance': 'నిపుణ మార్గదర్శకత్వం',
    'home.expertGuidanceDesc': '24/7 AI అసిస్టెంట్ వ్యవసాయ సలహాలు, చికిత్సా ప్రణాళికలు మరియు నివారణ చర్యలను అందిస్తుంది',
    'home.communitySupport': 'కమ్యూనిటీ మద్దతు',
    'home.communitySupportDesc': 'భాగస్వామ్య జ్ఞానం మరియు మద్దతు కోసం సహ వ్యవసాయుల మరియు వ్యవసాయ నిపుణులతో కనెక్ట్ అవండి',
    'home.howItWorks': 'AgriClip ఎలా పని చేస్తుంది',
    'home.howItWorksDesc': 'మూడు సులభమైన దశలలో సరళమైన, వేగవంతమైన మరియు ఖచ్చితమైన పంట వ్యాధి గుర్తింపు',
    'home.uploadImage': 'చిత్రాన్ని అప్‌లోడ్ చేయండి',
    'home.uploadImageDesc': 'మా సహజమైన ఇంటర్‌ఫేస్‌ను ఉపయోగించి మీ పంట యొక్క ఫోటో తీయండి లేదా చిత్రాన్ని అప్‌లోడ్ చేయండి',
    'home.aiAnalysis': 'AI విశ్లేషణ',
    'home.aiAnalysisDesc': 'మా AI అధునాతన మెషిన్ లెర్నింగ్ అల్గోరిథమ్‌లను ఉపయోగించి చిత్రాన్ని విశ్లేషిస్తుంది',
    'home.getResults': 'ఫలితాలను పొందండి',
    'home.getResultsDesc': 'తక్షణ రోగనిర్ధారణ, చికిత్సా సిఫార్సులు మరియు నిపుణ సలహాలను స్వీకరించండి',
    'home.readyToProtect': 'మీ పంటలను రక్షించడానికి సిద్ధంగా ఉన్నారా?',
    'home.joinThousands': 'పంట ఆరోగ్య నిర్వహణ కోసం AgriClip ని నమ్మే ప్రపంచవ్యాప్తంగా వేలాది వ్యవసాయులతో చేరండి',
    'home.startFreeTrial': 'ఉచిత ట్రయల్ ప్రారంభించండి',
    'home.viewDemo': 'డెమో చూడండి',
    
    // Login page
    'login.welcomeBack': 'మళ్లీ స్వాగతం',
    'login.signInToContinue': 'AgriClip కు కొనసాగడానికి సైన్ ఇన్ చేయండి',
    'login.signIn': 'సైన్ ఇన్',
    'login.enterCredentials': 'మీ ఖాతాకు ప్రవేశించడానికి మీ ఇమెయిల్ మరియు పాస్‌వర్డ్‌ను నమోదు చేయండి',
    'login.email': 'ఇమెయిల్',
    'login.password': 'పాస్‌వర్డ్',
    'login.forgotPassword': 'పాస్‌వర్డ్ మర్చిపోయారా?',
    'login.signingIn': 'సైన్ ఇన్ అవుతోంది...',
    'login.orContinueWith': 'లేదా కొనసాగించండి',
    'login.signInWithGoogle': 'Google తో సైన్ ఇన్ చేయండి',
    'login.dontHaveAccount': 'ఖాతా లేదా?',
    'login.signUpHere': 'ఇక్కడ సైన్ అప్ చేయండి',
    
    // Dashboard
    'dashboard.title': 'AgriClip డ్యాష్‌బోర్డ్',
    'dashboard.subtitle': 'AI-ఆధారిత పంట వ్యాధి గుర్తింపు మరియు వ్యవసాయ సహాయం',
    'dashboard.cropAnalysis': 'పంట విశ్లేషణ',
    'dashboard.dropImage': 'మీ పంట చిత్రాన్ని ఇక్కడ డ్రాప్ చేయండి',
    'dashboard.clickToBrowse': 'లేదా ఫైళ్లను బ్రౌజ్ చేయడానికి క్లిక్ చేయండి',
    'dashboard.supportedFormats': 'మద్దతు: JPG, PNG, WebP (గరిష్ట 10MB)',
    'dashboard.browseFiles': 'ఫైళ్లను బ్రౌజ్ చేయండి',
    'dashboard.takePhoto': 'ఫోటో తీయండి',
    'dashboard.recentUploads': 'ఇటీవలి అప్‌లోడ్‌లు',
    'dashboard.noUploadsYet': 'ఇంకా అప్‌లోడ్‌లు లేవు',
    'dashboard.aiAssistant': 'AI అసిస్టెంట్',
    'dashboard.askAboutCrops': 'పంట వ్యాధులు, వ్యవసాయ పద్ధతులు గురించి అడగండి లేదా చిత్రాన్ని అప్‌లోడ్ చేయండి...',
    'dashboard.uploadingAndAnalyzing': 'అప్‌లోడ్ మరియు విశ్లేషించడం...',
    'dashboard.aiIsTyping': 'AI టైప్ చేస్తోంది...',
    'dashboard.chatCleared': 'చాట్ క్లియర్ చేయబడింది! నేడు నేను మీకు ఎలా సహాయం చేయగలను?',
    
    // Profile
    'profile.title': 'ప్రొఫైల్',
    'profile.subtitle': 'మీ ఖాతాను నిర్వహించండి మరియు మీ AgriClip కార్యకలాపాలను చూడండి',
    'profile.verifiedFarmer': 'ధృవీకరించబడిన వ్యవసాయి',
    'profile.farmSize': 'వ్యవసాయ భూమి పరిమాణం',
    'profile.primaryCrops': 'ప్రధాన పంటలు',
    'profile.activityStats': 'కార్యకలాప గణాంకాలు',
    'profile.totalAnalyses': 'మొత్తం విశ్లేషణలు',
    'profile.healthyCrops': 'ఆరోగ్యకరమైన పంటలు',
    'profile.issuesFound': 'కనుగొనబడిన సమస్యలు',
    'profile.chatSessions': 'చాట్ సెషన్‌లు',
    'profile.profileSettings': 'ప్రొఫైల్ సెట్టింగ్‌లు',
    'profile.activityHistory': 'కార్యకలాప చరిత్ర',
    'profile.personalInformation': 'వ్యక్తిగత సమాచారం',
    'profile.updateProfileDetails': 'మీ ప్రొఫైల్ వివరాలను మరియు అభిరుచులను నవీకరించండి',
    'profile.fullName': 'పూర్తి పేరు',
    'profile.bio': 'బయో',
    'profile.phoneNumber': 'ఫోన్ నంబర్',
    'profile.location': 'స్థానం',
    'profile.recentAnalyses': 'మీ ఇటీవలి AgriClip విశ్లేషణలు మరియు సంభాషణలు',
    'profile.saveChanges': 'మార్పులను సేవ్ చేయండి',
    
    // Toast messages
    'toast.loginSuccess': 'లాగిన్ విజయవంతం!',
    'toast.welcomeBack': 'AgriClip కు మళ్లీ స్వాగతం',
    'toast.loginFailed': 'లాగిన్ విఫలమైంది',
    'toast.checkCredentials': 'దయచేసి మీ ధృవీకరణలను తనిఖీ చేయండి',
    'toast.loggedOut': 'లాగ్‌అవుట్ విజయవంతంగా జరిగింది',
    'toast.loggedOutDesc': 'మీరు AgriClip నుండి లాగ్‌అవుట్ అయ్యారు',
    'toast.profileUpdated': 'ప్రొఫైల్ నవీకరించబడింది',
    'toast.profileUpdatedDesc': 'మీ ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది.',
    'toast.chatCleared': 'చాట్ క్లియర్ చేయబడింది',
    'toast.chatClearedDesc': 'అన్ని సందేశాలు తొలగించబడ్డాయి',
    'toast.imageUploaded': 'చిత్రం విజయవంతంగా అప్‌లోడ్ చేయబడింది',
    'toast.analysisInProgress': 'AI విశ్లేషణ ప్రగతిలో ఉంది...',
    'toast.invalidFileType': 'చెల్లని ఫైల్ రకం',
    'toast.uploadImageFile': 'దయచేసి చిత్ర ఫైల్ (JPG, PNG, మొదలైనవి) అప్‌లోడ్ చేయండి',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
