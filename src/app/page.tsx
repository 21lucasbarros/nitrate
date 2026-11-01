"use client";

import { useAuth } from '@/lib/auth-context';
import Header from './components/header';
import Hero from './components/hero';
import Features from './components/features';
import TrendingReviews from './components/trending-reviews';
import CTA from './components/cta';
import Footer from './components/footer';
import UserHome from './components/user-home';

export default function HomePage() {
  const { status, user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-blue selection:text-background">
      <Header />
      {/* enquanto descobre se há sessão, só reserva o espaço para o footer não pular */}
      {status === "loading" && <div className="min-h-screen" />}
      {status === "authenticated" && <UserHome user={user} />}
      {status === "anonymous" && (
        <>
          <Hero />
          <Features />
          <TrendingReviews />
          <CTA />
        </>
      )}
      <Footer />
    </div>
  );
}
