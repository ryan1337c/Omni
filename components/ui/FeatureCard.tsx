import React from 'react';
import { Feature } from '../types/types';

interface FeatureCardProps {
  feature: Feature;
  inView: boolean;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, inView, index }) => {
  const Icon = feature.icon;

    return (
        // Outer wrapper: staggered scroll-entrance animation (the transition delay lives here only)
        <div
        className={`h-full w-full transition-all duration-300 ease-in-out
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
        style={{ transitionDelay: `${index * 100}ms` }}
        >
        {/* Inner card: hover effects have no transition delay, so hover responds instantly */}
        <div
        className={`relative rounded-xl p-6 h-full w-full group
            transition-all duration-300 ease-in-out
            bg-white/80 border border-gray-200/60 dark:bg-gray-900/20 dark:border-transparent
            shadow-lg hover:shadow-xl hover:shadow-pink-500/30 dark:hover:shadow-indigo-500/30 transform hover:-translate-y-2
        `}
        >
        <div className="flex flex-col items-center text-center">
            <div className={`mb-5 p-4 rounded-full bg-gradient-to-br transition-colors duration-300
            from-violet-100 to-pink-100 group-hover:from-pink-200 group-hover:to-pink-100
            dark:from-indigo-500/20 dark:to-indigo-500/20 dark:group-hover:from-indigo-500/30 dark:group-hover:to-indigo-500/30`
            }>
            <Icon className="w-8 h-8 transition-colors duration-300 text-pink-400 dark:text-indigo-300" />
            </div>
            <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
        </div>
        </div>
        </div>
    );
};

export default FeatureCard;