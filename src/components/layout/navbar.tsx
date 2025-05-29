"use client";

import { cn } from "@/lib/utils";
import { LogIn, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900">Crystal Mall</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/product/list"
                className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                All Products
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Link href="/account" title="My Account">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">My Account</span>
              </Button>
            </Link>
            <Link href="/cart" title="Shopping Cart">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Shopping Cart</span>
              </Button>
            </Link>
          </div>
          <div className="flex items-center sm:hidden">
            <Link href="/cart" title="Shopping Cart" className="mr-2">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-6 w-6" />
                <span className="sr-only">Shopping Cart</span>
              </Button>
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              <svg
                className={cn("h-6 w-6", isMenuOpen ? "hidden" : "block")}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={cn("h-6 w-6", isMenuOpen ? "block" : "hidden")}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn("sm:hidden border-t border-gray-200", isMenuOpen ? "block" : "hidden")}
        id="mobile-menu"
      >
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="border-transparent text-gray-900 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Home
          </Link>
          <Link
            href="/product/list"
            onClick={() => setIsMenuOpen(false)}
            className="border-transparent text-gray-900 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            All Products
          </Link>
          <Link
            href="/contact"
            onClick={() => setIsMenuOpen(false)}
            className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Contact Us
          </Link>
          <Link
            href="/blog"
            onClick={() => setIsMenuOpen(false)}
            className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Blog
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="px-2 space-y-1">
            <Link
              href="/account"
              onClick={() => setIsMenuOpen(false)}
              className="group flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <User className="mr-3 h-6 w-6 text-gray-500 group-hover:text-gray-600" />
              My Account
            </Link>
            <Link
              href="/account/login"
              onClick={() => setIsMenuOpen(false)}
              className="group flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <LogIn className="mr-3 h-6 w-6 text-gray-500 group-hover:text-gray-600" />
              Login / Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 