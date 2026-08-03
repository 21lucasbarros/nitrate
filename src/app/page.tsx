"use client";

import Header from './components/header';
import Hero from './components/hero';
import Features from './components/features';
import TrendingReviews from './components/trending-reviews';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-blue selection:text-background">
      <Header />
      <Hero />
      <Features />
      <TrendingReviews />
    </div>
  );
}
