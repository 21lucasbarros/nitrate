export default function NavBar() {
  return (
    <nav className="fixed top-0 w-full px-6 py-5 flex justify-between items-center z-50 bg-white text-foreground border-b border-brand-slate/5">
      <div className="text-xl font-bold tracking-tighter uppercase flex items-center gap-1">
        Nitrate<div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1"></div>
      </div>
      <div className="hidden lg:flex gap-8 text-sm font-medium tracking-wide">
        <a href="#" className="hover:text-brand-blue transition-colors">Recursos</a>
        <a href="#" className="hover:text-brand-blue transition-colors">Comunidade</a>
        <a href="#" className="hover:text-brand-blue transition-colors">Importar Dados</a>
      </div>
      <div className="flex gap-4 items-center">
        <button className="hidden sm:block text-sm font-medium hover:text-brand-orange transition-colors">Entrar</button>
        <button className="text-sm font-medium px-4 py-2 bg-brand-btn text-brand-btn-text rounded-full hover:bg-brand-btn/90 transition-colors">
          Criar Conta
        </button>
      </div>
    </nav>
  )
}
