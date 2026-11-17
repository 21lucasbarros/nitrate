"use client";

import { useAuth } from '@/lib/auth-context';
import Header from './components/header';
import Hero from './components/hero';
import Features from './components/features';
import TrendingReviews from './components/trending-reviews';
import CTA from './components/cta';
import Footer from './components/footer';
import UserHome from './components/user-home';
import { HomeSkeleton } from './components/home-skeleton';

export default function HomePage() {
  const { status, user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-blue selection:text-background">
      <Header />
      {/* enquanto descobre se há sessão (a API pode demorar a acordar), mostra o formato da home */}
      {status === "loading" && <HomeSkeleton />}
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
