import { Link, useLocation } from "react-router";
import { Brain, User } from "lucide-react";

export function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="bg-white border-b-2 border-gray-300 px-8 py-4">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-100 border border-gray-300 flex items-center justify-center">
              <Brain className="w-5 h-5 text-gray-700" />
            </div>
          <span className="text-xl font-bold text-gray-900">
            Cognitrack
          </span>
        </Link>
        
        <div className="flex items-center gap-8">
          <Link 
            to="/dashboard" 
            className={`text-sm font-medium ${
              location.pathname === '/dashboard' 
                ? 'text-gray-900 underline' 
                : 'text-gray-600'
            }`}
          >
            Dashboard
          </Link>
          {/* hidden for now
          <Link
            to="/patients"
            className={`text-sm font-medium ${
              location.pathname === '/patients'
                ? 'text-gray-900 underline'
                : 'text-gray-600'
            }`}
          >
            Patients
          </Link>
          */}
          <Link 
            to="/upload" 
            className={`text-sm font-medium ${
              location.pathname === '/upload' 
                ? 'text-gray-900 underline' 
                : 'text-gray-600'
            }`}
          >
            Upload
          </Link>
          <Link 
            to="/" 
            className={`text-sm font-medium ${
              location.pathname === '/' 
                ? 'text-gray-900 underline' 
                : 'text-gray-600'
            }`}
          >
            About
          </Link>
          
          {/* GP Avatar */}
          <div className="ml-4 flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">Alex Anderson</div>
              <div className="text-xs text-gray-600">Third-Year Medical Student</div>
            </div>
            <div className="w-10 h-10 bg-gray-200 border-2 border-gray-400 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
