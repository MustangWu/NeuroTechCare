import { Link, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

export function Navigation() {
  const location = useLocation();
  const { email, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center gap-6 overflow-x-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="text-xl text-gray-900">Cognitrack</span>
        </Link>

        <nav className="flex items-center gap-4 shrink-0">
          <Link
            to="/"
            className={`text-sm pb-1 ${
              location.pathname === "/"
                ? "text-gray-900 font-medium border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Home
          </Link>
          <Link
            to="/upload"
            className={`text-sm pb-1 ${
              location.pathname === "/upload"
                ? "text-gray-900 font-medium border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Upload
          </Link>
          <Link
            to="/persons"
            className={`text-sm pb-1 ${
              location.pathname.startsWith("/person")
                ? "text-gray-900 font-medium border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Track Care Recipients
          </Link>
          <Link
            to="/results"
            className={`text-sm pb-1 ${
              location.pathname === "/results"
                ? "text-gray-900 font-medium border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Results
          </Link>
          <Link
            to="/flashcards"
            className={`text-sm pb-1 ${
              location.pathname === "/flashcards"
                ? "text-gray-900 font-medium border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Get a Quiz
          </Link>
          <Link
            to="/dashboard"
            className={`text-sm pb-1 ${
              location.pathname === "/dashboard"
                ? "text-gray-900 font-medium border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Find Out More
          </Link>
        </nav>
        {email && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-600">{email}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-3 py-1 hover:bg-gray-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
