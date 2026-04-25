import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';
import CategoryGrid from '../components/CategoryGrid';
import BoutiqueFavorites from '../components/BoutiqueFavorites';
import About from '../components/About';
import Newsletter from '../components/Newsletter';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

export default function Home() {
  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <Navbar />
      <SEO />
      <main>
        <Hero />
        <FeaturedProducts />
        <CategoryGrid />
        <BoutiqueFavorites />
        <About />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
