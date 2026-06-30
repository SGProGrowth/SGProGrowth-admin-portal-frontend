import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { quotes } from '../data';
import { Icon } from '../lib/icons';

export function QuoteBanner() {
  const [i, setI] = useState(() => Math.floor(Math.random() * quotes.length));

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % quotes.length), 7000);
    return () => clearInterval(t);
  }, []);

  const q = quotes[i];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 p-6 text-white shadow-lg">
      <div className="absolute -right-6 -top-6 opacity-10">
        <Icon name="quote" size={120} />
      </div>
      <div className="relative flex items-start gap-3">
        <Icon name="sparkle" size={20} className="mt-1 shrink-0 text-brand-200" />
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-lg font-semibold leading-snug">“{q.text}”</p>
            <p className="mt-1 text-sm text-brand-200">— {q.author}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
