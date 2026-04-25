import { Link, useLocation } from "react-router";

export function Navigation() {
  const location = useLocation();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="text-xl text-gray-900">Cognitrack</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className={`text-sm ${
              location.pathname === "/dashboard"
                ? "text-gray-900 font-medium"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Dashboard
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
            to="/"
            className={`text-sm ${
              location.pathname === "/"
                ? "text-gray-900 font-medium"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
