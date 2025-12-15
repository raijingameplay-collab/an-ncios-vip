import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="font-display text-xl font-bold gradient-text">
              ClassiAds
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Plataforma de classificados profissionais.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Navegação</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Catálogo</Link></li>
              <li><Link to="/auth?mode=signup" className="hover:text-foreground transition-colors">Anunciar</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Suporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contato</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ClassiAds. Todos os direitos reservados.</p>
          <p className="mt-1">
            Esta plataforma é apenas um espaço publicitário e não intermedia serviços.
          </p>
        </div>
      </div>
    </footer>
  );
}
