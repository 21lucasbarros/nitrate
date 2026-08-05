export default function Footer() {
  return (
    <footer className="bg-brand-slate text-background/50 py-10 sm:py-12 px-6 md:px-12 xl:px-24 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-6 text-center md:text-left">
      <div className="text-xl sm:text-2xl font-bold tracking-tighter text-background uppercase flex items-center justify-center md:justify-start gap-1">
        Nitrate<div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1"></div>
      </div>
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium">
        <a href="#" className="hover:text-background transition-colors">Plataforma</a>
        <a href="#" className="hover:text-background transition-colors">Preços</a>
        <a href="#" className="hover:text-background transition-colors">Migração</a>
        <a href="#" className="hover:text-background transition-colors">Suporte</a>
      </div>
      <div className="text-xs sm:text-sm font-mono uppercase tracking-widest">
        © {new Date().getFullYear()} Nitrate Platform
      </div>
    </footer>
  );
}
