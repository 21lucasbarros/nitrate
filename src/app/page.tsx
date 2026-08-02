"use client";

import NavBar from './components/nav-bar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-blue selection:text-background">
      <NavBar />
    </div>
  );
}
