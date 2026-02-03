import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import RouteSearchSection from '../components/RouteSearchSection';
import MapExploreSection from '../components/MapExploreSection';
import HowItWorksSection from '../components/HowItWorksSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';

function MainPage() {
    return (
        <>
            {/* Navbar */}
            <Navbar />

            {/* Hero Section */}
            <HeroSection />
            <RouteSearchSection />
            <MapExploreSection />
            <HowItWorksSection />
            <ContactSection />
            <Footer />
        </>
    );
}

export default MainPage;
