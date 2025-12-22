import React from 'react';
import { Heart, Github, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">
              Minecraft Animation Converter
            </h3>
            <p className="text-gray-400 mb-4 max-w-md">
              A powerful web-based tool that automatically converts Minecraft Java Edition 
              animation resource packs to Bedrock-compatible format. Built for the Minecraft 
              community with ❤️.
            </p>
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>for Minecraft players</span>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
              Features
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-green-400">✓</span>
                <span className="ml-2">Euler to Quaternion Conversion</span>
              </li>
              <li>
                <span className="text-green-400">✓</span>
                <span className="ml-2">Bone Name Mapping</span>
              </li>
              <li>
                <span className="text-green-400">✓</span>
                <span className="ml-2">Animation Controller Generation</span>
              </li>
              <li>
                <span className="text-green-400">✓</span>
                <span className="ml-2">Instant Download</span>
              </li>
              <li>
                <span className="text-green-400">✓</span>
                <span className="ml-2">Mobile Friendly</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
              Support
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="#how-it-works" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a 
                  href="#troubleshooting" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Troubleshooting
                </a>
              </li>
              <li>
                <a 
                  href="#faq" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4 mr-1" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>All systems operational</span>
              </div>
              <div className="text-sm text-gray-500">
                v1.0.0
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-gray-400">
                © 2024 Animation Converter Tool
              </span>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span className="text-gray-400">Global Service</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;