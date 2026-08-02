"use client";

import Header from './components/header';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-blue selection:text-background">
      <Header />
    </div>
  );
}
