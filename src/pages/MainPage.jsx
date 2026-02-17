import React from 'react';
import HeroSection from '../components/HeroSection';
import RouteSearchSection from '../components/RouteSearchSection';
import MapExploreSection from '../components/MapExploreSection';
import HowItWorksSection from '../components/HowItWorksSection';
import ContactSection from '../components/ContactSection';

function MainPage() {
    return (
        <>
            {/* Hero Section */}
            <HeroSection />
            <RouteSearchSection />
            <MapExploreSection />
            <HowItWorksSection />
            <ContactSection />
        </>
    );
}

export default MainPage;
