'use client';

import Hero from '@/components/Hero';
import SectionFeatures from '@/components/SectionFeatures';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <main>
        <Hero />
        <SectionFeatures />
      </main>
    </ProtectedRoute>
  );
}
