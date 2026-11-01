import { Link } from 'react-router-dom'; // Remove or replace with your routing solution if needed

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center relative">
        {/* Large 401 Heading */}
        <h1 className="text-9xl font-extrabold text-rose-600 tracking-widest select-none">
          401
        </h1>
        
        {/* Floating Tag */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
          Unauthorized Access
        </div>

        {/* Subheading & Description */}
        <div className="mt-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Whoops! You need to log in first.
          </h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Access to this resource is restricted. Please sign in with the correct credentials or return to the home page.
          </p>
        </div>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3 bg-rose-600 text-white font-medium rounded-lg shadow-md hover:bg-rose-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            Sign In
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;