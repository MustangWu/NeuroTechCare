import { Link, useLocation } from "react-router";
import { Brain, User } from "lucide-react";

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-border px-8 py-4">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-secondary border border-border rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-medium text-primary">
            Cognitrack
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <Link
            to="/dashboard"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/dashboard'
                ? 'text-primary border-b-2 border-primary pb-0.5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dashboard
          </Link>
          {/* hidden for now
          <Link
            to="/patients"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/patients'
                ? 'text-primary border-b-2 border-primary pb-0.5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Patients
          </Link>
          */}
          <Link
            to="/upload"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/upload'
                ? 'text-primary border-b-2 border-primary pb-0.5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Upload
          </Link>
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/'
                ? 'text-primary border-b-2 border-primary pb-0.5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            About
          </Link>

          {/* GP Avatar */}
          <div className="ml-4 flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">Alex Anderson</div>
              <div className="text-xs text-muted-foreground">Third-Year Medical Student</div>
            </div>
            <div className="w-10 h-10 bg-secondary border border-border rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
