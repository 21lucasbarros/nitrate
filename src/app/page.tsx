"use client";

import Features from './components/features';
import Header from './components/header';
import Hero from './components/hero';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-blue selection:text-background">
      <Header />
      <Hero />
      <Features />
    </div>
  );
}
