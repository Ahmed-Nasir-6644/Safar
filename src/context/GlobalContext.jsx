import React, { createContext, useContext, useState, useEffect } from 'react';

const GlobalContext = createContext();
const AUTH_API_URL = 'http://localhost:5000/auth';

export const GlobalProvider = ({ children }) => {
    // Auth State
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mock History Data
    const [history, setHistory] = useState([
        { id: 1, from: "Central Station", to: "Airport Terminal 1", date: "2023-10-24", fare: "$4.50" },
        { id: 2, from: "Downtown", to: "City Park", date: "2023-10-22", fare: "$2.00" },
        { id: 3, from: "University", to: "Library", date: "2023-10-20", fare: "$1.50" }
    ]);

    // Language State
    const [language, setLanguage] = useState('en');

    // Feedback Mock
    const [feedbacks, setFeedbacks] = useState([]);

    const translations = {
        en: {
            home: "Home",
            findRoutes: "Find Routes",
            history: "History",
            help: "Help & Contribute",
            login: "Login",
            signup: "Sign Up",
            logout: "Log Out",
            welcome: "Welcome",
            networkMap: "Network Map",
            welcomeTitle: "MetroMate",
            welcomeSubtitle: "Your smart companion for seamless daily commuting.",
            welcomeFeature: "Real-time updates. Smart routing. Cashless payments.",
            planRoute: "Plan Your Route",

            // Navbar & Profile
            myHistory: "My History",
            myFavorites: "My Favorites",
            englishAbbr: "EN",
            urduAbbr: "UR",

            // Map Explore Section
            interactiveMap: "Interactive Map",
            exploreCityTitle: "Explore the City Like Never Before.",
            exploreCityDesc: "Discover key landmarks, metro stations, and popular spots directly on our interactive map. Plan your trip visually.",
            openFullMap: "Open Full Map",
            shopping: "Shopping",
            landmark: "Landmark",
            business: "Business",
            nature: "Nature",
            liveView: "Live View",
            islamabadMetroNetwork: "Islamabad Metro Network",

            // Find Route Page
            findRouteTitle: "Find Your Route",
            findRouteSubtitle: "Enter your trip details to get the best route.",
            startingPoint: "Starting Point",
            destination: "Destination",
            voiceSearch: "Voice Search",
            
            // Voice Search Error Messages
            voicePermissionDenied: "Microphone permission denied. Please allow microphone access and try again.",
            voiceAccessDenied: "Could not access microphone. Please check your device settings.",
            voiceDetectionFailed: "Could not detect source/destination. Please try again.",
            voiceServerError: "Server error",
            voiceDetected: "Detected",
            
            listening: "Listening...",
            searchRoute: "Search Route",
            routeSteps: "Route Steps",
            totalFare: "Total Fare",
            distance: "Distance",
            mapVisualization: "Map Visualization",
            payFare: "Pay Fare",
            payAtStation: "Pay at Station",
            ticketBooked: "Ticket Booked!",
            qrGenerated: "Your QR code has been generated.",
            bookAnother: "Book Another",
            processing: "Processing payment...",

            // Mock Route Steps (Generic for now)
            step1: "Walk to Central Station (5 mins)",
            step2: "Take Line A towards Airport",
            step3: "Get off at Terminal 1",
            step4: "Walk to destination",

            // Network Map Page
            mapTitle: "Transit Network Map",
            mapSubtitle: "Explore the city's modern transit network with our interactive map.",
            activeRoutes: "Active Routes",
            allLines: "All Lines",
            visible: "visible",
            legend: "Legend",
            interchangeStation: "Interchange Station",
            regularStation: "Regular Station",
            regularStation: "Regular Station",
            clickForArrival: "Click on any station on the map to see arrival times (Simulated).",
            metroLines: "Metro Lines",
            orangeLineTrain: "Orange Line Train",
            metroBusRed: "Metro Bus (Red)",

            // History Page
            tripHistory: "Trip History",
            favoriteRoutes: "Favorite Routes",
            trips: "Trips",
            favorites: "Favorites",
            noFavorites: "No favorite routes saved yet.",
            noTrips: "No trips recorded yet.",

            // Help Page
            howCanWeHelp: "How can we help?",
            faqSubtitle: "Frequently asked questions and support.",
            contribute: "Contribute",
            contributeSubtitle: "Help us improve MetroMate for everyone.",
            suggestFeature: "Suggest a Feature",
            yourSuggestion: "Your Suggestion",
            name: "Name",
            email: "Email",
            message: "Message",
            submitFeedback: "Submit Feedback",
            thankYou: "Thank You!",
            feedbackReceived: "Your feedback has been received.",

            // FAQs
            q1: "How do I find a route?",
            a1: "Go to the 'Find Routes' page, enter your starting point and destination, and click search. You can also use the voice search feature.",
            q2: "How is the fare calculated?",
            a2: "Fares are calculated based on distance and the transport lines used. We display the estimated total fare for each route.",
            q3: "Can I save my favorite routes?",
            a3: "Yes! Your recent routes are automatically saved in the History page for easy access.",
            q4: "What do I do in an emergency?",
            a4: "Use the floating red 'SOS' button visible on every page to quickly send an alert to your emergency contacts.",

            // Footer
            footerTagline: "Making public transport simple & smart.",
            footerLocation: "Islamabad • Rawalpindi",
            about: "About",
            contact: "Contact",
            privacy: "Privacy",
            rightsReserved: "All rights reserved.",

            // Route Search Section
            findBestRouteTitle: "Find Your Best Route",
            findBestRouteDesc: "Enter your starting point and destination to get the fastest metro connection.",
            fromPlaceholder: "From (e.g. Saddar)",
            toPlaceholder: "To (e.g. Pak Secretariat)",
            searchButton: "Search",
            stationsCount: "250+",
            stationsLabel: "Stations",
            linesCount: "4",
            linesLabel: "Active Lines",
            commutersCount: "50k+",
            commutersLabel: "Daily Commuters",

            // How It Works Section
            howItWorksTitle: "How MetroMate Works",
            howItWorksDesc: "Navigate the city like a pro in just 4 simple steps.",
            step1Title: "Enter Destination",
            step1Desc: "Type where you want to go in Islamabad or Rawalpindi.",
            step2Title: "Smart Analysis",
            step2Desc: "Our AI finds the fastest Metro & feeder routes.",
            step3Title: "Choose Option",
            step3Desc: "Select the cheapest or fastest travel plan.",
            step4Title: "Travel Safely",
            step4Desc: "Get real-time updates and travel with confidence.",

            // Contact Section
            getInTouch: "Get in Touch",
            contactDesc: "Have questions about routes, fares, or looking to partner with MetroMate? We're here to help.",
            emailUs: "Email Us",
            callUs: "Call Us",
            visitHq: "Visit HQ",
            hqAddress: "Metro Bus Command Center, Jinnah Avenue, Islamabad",
            fullName: "Full Name",
            emailAddress: "Email Address",
            sendMessage: "Send Message",
            messageSent: "Message sent successfully! We'll get back to you soon.",
            messageError: "Failed to send message. Please try again.",
            sending: "Sending..."
        },
        ur: {
            home: "گھر",
            findRoutes: "راستہ تلاش کریں",
            history: "تاریخچہ",
            help: "مدد اور تعاون",
            login: "لاگ ان",
            signup: "سائن اپ",
            logout: "لاگ آؤٹ",
            welcome: "خوش آمدید",
            networkMap: "نیٹ ورک کا نقشہ",

            welcomeTitle: "میٹرو میٹ",
            welcomeSubtitle: "ہموار روزانہ سفر کے لیے آپ کا سمارٹ ساتھی۔",
            welcomeFeature: "اصل وقت کی تازہ کاری۔ سمارٹ روٹنگ۔ بغیر نقد ادائیگی۔",
            planRoute: "اپنا راستہ بنائیں",

            // Navbar & Profile
            myHistory: "میری تاریخ",
            myFavorites: "میرے پسندیدہ",
            englishAbbr: "انگریزی",
            urduAbbr: "اردو",

            // Map Explore Section
            interactiveMap: "انٹرایکٹو نقشہ",
            exploreCityTitle: "شہر کو دریافت کریں جیسا کہ پہلے کبھی نہیں ہوا",
            exploreCityDesc: "کلیدی نشانیاں، میٹرو اسٹیشن، اور مشہور مقامات براہ راست ہمارے انٹرایکٹو نقشے پر دریافت کریں۔ اپنے سفر کا بصری طور پر منصوبہ بنائیں۔",
            openFullMap: "پورا نقشہ کھولیں",
            shopping: "خریداری",
            landmark: "نشانی",
            business: "کاروبار",
            nature: "فطرت",
            liveView: "لائیو ویو",
            islamabadMetroNetwork: "اسلام آباد میٹرو نیٹ ورک",

            // Find Route Page
            findRouteTitle: "اپنا راستہ تلاش کریں",
            findRouteSubtitle: "بہترین راستہ حاصل کرنے کے لیے اپنے سفر کی تفصیلات درج کریں۔",
            startingPoint: "آغاز کا مقام",
            destination: "منزل",
            voiceSearch: "آواز تلاش",
            
            // Voice Search Error Messages
            voicePermissionDenied: "مائیکروفون کی اجازت مسترد۔ مہربانی کر کے مائیکروفون کی رسائی کی اجازت دیں اور دوبارہ کوشش کریں۔",
            voiceAccessDenied: "مائیکروفون تک رسائی نہیں ہو سکی۔ براہ کرم اپنے ڈیوائس کی سیٹنگ چیک کریں۔",
            voiceDetectionFailed: "منزل اور ابتدائی مقام کی شناخت نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔",
            voiceServerError: "سرور میں خرابی",
            voiceDetected: "شناخت ہوا",
            
            listening: "سن رہا ہے...",
            searchRoute: "راستہ تلاش کریں",
            routeSteps: "راستے کے اقدامات",
            totalFare: "کل کرایہ",
            distance: "فاصلہ",
            mapVisualization: "نقشہ کا نظارہ",
            payFare: "کرایہ ادا کریں",
            payAtStation: "اسٹیشن پر ادا کریں",
            ticketBooked: "ٹکٹ بک ہو گیا!",
            qrGenerated: "آپ کا کیو آر کوڈ تیار ہو گیا ہے۔",
            bookAnother: "ایک اور بک کریں",
            bookAnother: "ایک اور بک کریں",
            processing: "ادائیگی ہو رہی ہے...",

            // Mock Route Steps
            step1: "سنٹرل اسٹیشن تک چلیں (5 منٹ)",
            step2: "ایئرپورٹ کی طرف لائن A لیں",
            step3: "ٹرمینل 1 پر اتریں",
            step4: "منزل تک چلیں",

            // Network Map Page
            mapTitle: "ٹرانزٹ نیٹ ورک کا نقشہ",
            mapSubtitle: "ہمارے انٹرایکٹو نقشے کے ساتھ شہر کے جدید ٹرانزٹ نیٹ ورک کو دریافت کریں۔",
            activeRoutes: "فعال راستے",
            allLines: "تمام لائنیں",
            visible: "نمایاں",
            legend: "علامات",
            interchangeStation: "انٹرچینج اسٹیشن",
            regularStation: "ریگولر اسٹیشن",
            regularStation: "ریگولر اسٹیشن",
            clickForArrival: "آمد کے اوقات دیکھنے کے لیے نقشے پر کسی بھی اسٹیشن پر کلک کریں۔",
            metroLines: "میٹرو لائنز",
            orangeLineTrain: "اورنج لائن ٹرین",
            metroBusRed: "میٹرو بس (سرخ)",

            // History Page
            tripHistory: "سفر کی تاریخ",
            favoriteRoutes: "پسندیدہ راستے",
            trips: "دورے",
            favorites: "پسندیدہ",
            noFavorites: "ابھی تک کوئی پسندیدہ راستہ محفوظ نہیں کیا گیا۔",
            noTrips: "ابھی تک کوئی دورہ ریکارڈ نہیں ہوا۔۔",

            // Footer
            footerTagline: "پبلک ٹرانسپورٹ کو آسان اور سمارٹ بنانا۔",
            footerLocation: "اسلام آباد • راولپنڈی",
            about: "کے بارے میں",
            contact: "رابطہ کریں",
            privacy: "پرائیویسی",
            rightsReserved: "جملہ حقوق محفوظ ہیں۔",

            // Route Search Section
            findBestRouteTitle: "اپنا بہترین راستہ تلاش کریں",
            findBestRouteDesc: "تیز ترین میٹرو کنکشن حاصل کرنے کے لیے اپنا ابتدائی مقام اور منزل درج کریں۔",
            fromPlaceholder: "سے (جیسے صدر)",
            toPlaceholder: "تک (جیسے پاک سیکرٹریٹ)",
            searchButton: "تلاش کریں",
            stationsCount: "250+",
            stationsLabel: "اسٹیشنز",
            linesCount: "4",
            linesLabel: "فعال لائنیں",
            commutersCount: "50k+",
            commutersLabel: "روزانہ مسافر",

            // How It Works Section
            howItWorksTitle: "میٹرو میٹ کیسے کام کرتا ہے",
            howItWorksDesc: "صرف 4 آسان مراحل میں ایک ماہر کی طرح شہر میں نیویگیٹ کریں۔",
            step1Title: "منزل درج کریں",
            step1Desc: "ٹائپ کریں کہ آپ اسلام آباد یا راولپنڈی میں کہاں جانا چاہتے ہیں۔",
            step2Title: "سمارٹ تجزیہ",
            step2Desc: "ہمارا AI تیز ترین میٹرو اور فیڈر روٹس تلاش کرتا ہے۔",
            step3Title: "آپشن منتخب کریں",
            step3Desc: "سب سے سستا یا تیز ترین سفر کا منصوبہ منتخب کریں۔",
            step4Title: "محفوظ سفر کریں",
            step4Desc: "اصل وقت کی تازہ کاری حاصل کریں اور اعتماد کے ساتھ سفر کریں۔",

            // Contact Section
            getInTouch: "رابطہ کریں",
            contactDesc: "راستوں، کرایوں کے بارے میں سوالات ہیں، یا میٹرو میٹ کے ساتھ شراکت کرنا چاہتے ہیں؟ ہم یہاں مدد کے لیے موجود ہیں۔",
            emailUs: "ہمیں ای میل کریں",
            callUs: "ہمیں کال کریں",
            visitHq: "ہیڈ کوارٹر وزٹ کریں",
            hqAddress: "میٹرو بس کمانڈ سینٹر، جناح ایونیو، اسلام آباد",
            fullName: "پورا نام",
            emailAddress: "ای میل ایڈریس",
            sendMessage: "پیغام بھیجیں",
            messageSent: "پیغام کامیابی سے بھیجا گیا! ہم جلد آپ سے رابطہ کریں گے۔",
            messageError: "پیغام بھیجنے میں ناکام۔ براہ کرم دوبارہ کوشش کریں۔",
            sending: "بھیجا جا رہا ہے...",

            // Help Page
            howCanWeHelp: "ہم آپ کی کیسے مدد کر سکتے ہیں؟",
            faqSubtitle: "اکثر پوچھے گئے سوالات اور تعاون۔",
            contribute: "حصہ ڈالیں",
            contributeSubtitle: "ہر کسی کے لیے میٹرو میٹ کو بہتر بنانے میں ہماری مدد کریں۔",
            suggestFeature: "ایک خصوصیت تجویز کریں",
            yourSuggestion: "آپ کی تجویز",
            name: "نام",
            email: "ای میل",
            message: "پیغام",
            submitFeedback: "فیڈ بیک جمع کرائیں",
            thankYou: "شکریہ!",
            feedbackReceived: "آپ کا فیڈ بیک موصول ہو گیا ہے۔",

            // FAQs
            q1: "میں راستہ کیسے تلاش کروں؟",
            a1: "'راستہ تلاش کریں' صفحے پر جائیں، اپنا ابتدائی مقام اور منزل درج کریں، اور تلاش پر کلک کریں۔ آپ وائس سرچ کی خصوصیت بھی استعمال کر سکتے ہیں۔",
            q2: "کرایہ کیسے شمار کیا جاتا ہے؟",
            a2: "کرایہ فاصلے اور استعمال ہونے والی ٹرانسپورٹ لائنوں کی بنیاد پر شمار کیا جاتا ہے۔ ہم ہر راستے کے لیے متوقع کل کرایہ ظاہر کرتے ہیں۔",
            q3: "کیا میں اپنے پسندیدہ راستے محفوظ کر سکتا ہوں؟",
            a3: "ہاں! آپ کے حالیہ راستے آسان رسائی کے لیے خود بخود ہسٹری صفحے میں محفوظ ہو جاتے ہیں۔",
            q4: "ایمرجنسی میں کیا کریں؟",
            a4: "اپنے ہنگامی رابطوں کو فوری الرٹ بھیجنے کے لیے ہر صفحے پر نظر آنے والا تیرتا ہوا سرخ 'SOS' بٹن استعمال کریں۔"
        }
    };

    const t = (key) => translations[language][key] || key;

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'ur' : 'en');
    };

    const submitFeedback = (data) => {
        setFeedbacks(prev => [...prev, { id: Date.now(), ...data }]);
        console.log("Feedback submitted:", data); // Feedback will be sent to backend dashboard later
    };

    // Simulate checking for a logged-in user on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await fetch(`${AUTH_API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            let errorMessage = 'Login failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch {
                errorMessage = `Server error: ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        const { accessToken, refreshToken, user: userData } = data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        return userData;
    };

    const signup = async (name, email, password) => {
        const response = await fetch(`${AUTH_API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
            let errorMessage = 'Registration failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch {
                errorMessage = `Server error: ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    };

    const addHistoryItem = (route) => {
        setHistory(prev => [route, ...prev]);
    };

    return (
        <GlobalContext.Provider value={{
            user,
            loading,
            login,
            signup,
            logout,
            history,
            addHistoryItem,
            language,
            toggleLanguage,
            t,
            submitFeedback
        }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContext = () => useContext(GlobalContext);
