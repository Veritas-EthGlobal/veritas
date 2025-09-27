"use client";

import { Swords } from "lucide-react";
import Link from "next/link";

type PageLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function PageLayout({ title, description, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white selection:bg-purple-500/30">
      <div className="relative isolate min-h-screen">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>

        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
             <Link href="/" className="flex items-center gap-2">
              <Swords className="h-6 w-6 text-purple-400" />
              <h1 className="text-xl font-bold tracking-tight">Patent</h1>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-8 text-center">
            <h2 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {title}
            </h2>
            <p className="mt-4 text-balance text-lg text-gray-400">
              {description}
            </p>
          </div>
          {children}
        </main>
        
         <div
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
