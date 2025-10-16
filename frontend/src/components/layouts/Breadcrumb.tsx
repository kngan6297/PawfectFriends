import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link
            to="/"
            className="text-gray-400 hover:text-gray-500 flex items-center"
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const name = value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <li key={to} className="flex items-center">
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
              {last ? (
                <span className="ml-2 text-sm font-medium text-gray-500">
                  {name}
                </span>
              ) : (
                <Link
                  to={to}
                  className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
