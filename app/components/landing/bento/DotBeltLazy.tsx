'use client';
import dynamic from 'next/dynamic';

// Canvas code is split into its own chunk and skipped during server rendering.
const DotBelt = dynamic(() => import('./DotBelt'), { ssr: false });

export default DotBelt;
