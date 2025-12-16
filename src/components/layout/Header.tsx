import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, LayoutDashboard, Shield, Menu } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const { user, signOut } = useAuth();
  const { isAdminOrModerator, isAdvertiser } = useUserRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const NavLinks = () => (
    <>
      <Link 
        to="/" 
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(false)}
      >
        Catálogo
      </Link>
      {user && isAdvertiser && (
        <Link 
          to="/painel" 
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setOpen(false)}
        >
          Meus Anúncios
        </Link>
      )}
      {user && isAdminOrModerator && (
        <Link 
          to="/admin/moderacao" 
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setOpen(false)}
        >
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold gradient-text">
              ClassiAds
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                {isAdvertiser && (
                  <DropdownMenuItem onClick={() => navigate('/painel')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Meus Anúncios
                  </DropdownMenuItem>
                )}
                {isAdminOrModerator && (
                  <DropdownMenuItem onClick={() => navigate('/admin/moderacao')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Painel Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Entrar
              </Button>
              <Button onClick={() => navigate('/cadastro')} className="gradient-bg">
                Anunciar
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLinks />
                {!user && (
                  <>
                    <Button variant="ghost" onClick={() => { navigate('/login'); setOpen(false); }}>
                      Entrar
                    </Button>
                    <Button onClick={() => { navigate('/cadastro'); setOpen(false); }} className="gradient-bg">
                      Anunciar
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
