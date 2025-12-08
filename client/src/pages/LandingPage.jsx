/**
 * Landing Page Component
 * Public homepage for unauthenticated users
 */

import { Link } from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  Shield, 
  Clock, 
  Users, 
  BarChart3,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Camera,
      title: 'Face Recognition',
      description: 'Advanced AI-powered face detection and recognition technology for secure attendance marking.'
    },
    {
      icon: MapPin,
      title: 'Location Verification',
      description: 'GPS-based location verification with anti-spoofing technology to ensure accurate attendance.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Enterprise-grade security with encrypted face data and secure authentication protocols.'
    },
    {
      icon: Clock,
      title: 'Real-time Tracking',
      description: 'Live attendance monitoring with instant updates and comprehensive reporting.'
    },
    {
      icon: Users,
      title: 'Multi-role Support',
      description: 'Dedicated dashboards for students, teachers, and administrators with role-based permissions.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Detailed attendance analytics, reports, and insights for better decision making.'
    }
  ];

  const benefits = [
    'Eliminate proxy attendance',
    'Reduce administrative overhead',
    'Improve attendance accuracy',
    'Generate automated reports',
    'Ensure location compliance',
    'Real-time notifications'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">SA</span>
              </div>
              <span className="ml-2 text-xl font-bold text-secondary-900">
                Smart Attendance
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-secondary-600 hover:text-primary-600 font-medium">
                Features
              </a>
              <a href="#about" className="text-secondary-600 hover:text-primary-600 font-medium">
                About
              </a>
              <a href="#contact" className="text-secondary-600 hover:text-primary-600 font-medium">
                Contact
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-md"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Smart Attendance System
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            Revolutionary face recognition and location-verified attendance tracking 
            for educational institutions and organizations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn btn-lg bg-white text-primary-600 hover:bg-secondary-50 px-8"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <button className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600 px-8">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-secondary-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Advanced technology solutions for modern attendance management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="card card-hover text-center p-8">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
                Why Choose Our System?
              </h2>
              <p className="text-lg text-secondary-600 mb-8">
                Transform your attendance management with cutting-edge technology 
                that ensures accuracy, security, and efficiency.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success-500 mr-3 flex-shrink-0" />
                    <span className="text-secondary-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  to="/register"
                  className="btn btn-primary btn-lg"
                >
                  Get Started Today
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="bg-secondary-100 rounded-2xl p-8 text-center">
                <div className="w-32 h-32 bg-primary-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Camera className="w-16 h-16 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                  Advanced Face Recognition
                </h3>
                <p className="text-secondary-600">
                  State-of-the-art AI technology for accurate and secure identification
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of institutions already using our smart attendance system
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn btn-lg bg-white text-primary-600 hover:bg-secondary-50 px-8"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600 px-8"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">SA</span>
              </div>
              <span className="ml-2 text-xl font-bold">Smart Attendance</span>
            </div>
            <p className="text-secondary-400 mb-6">
              Advanced face recognition and location-verified attendance system
            </p>
            <div className="text-sm text-secondary-500">
              © 2024 Smart Attendance System. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
