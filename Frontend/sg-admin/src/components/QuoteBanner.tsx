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
    <div className="alert-info relative overflow-hidden px-5 py-4">
      <div className="relative flex items-start gap-3">
        <Icon name="sparkle" size={18} className="mt-0.5 shrink-0 text-brand-600" />
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-sm font-medium leading-relaxed text-brand-900">“{q.text}”</p>
            <p className="mt-1 text-xs text-brand-700">— {q.author}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
