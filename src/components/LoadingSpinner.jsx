import { motion } from 'framer-motion';

export default function LoadingSpinner({ fullScreen = true, size = "md", showText = true }) {
  const sizes = {
    sm: { ring: "w-8 h-8", inner: "w-4 h-4", dot: "w-1", text: "text-xs" },
    md: { ring: "w-16 h-16", inner: "w-8 h-8", dot: "w-1.5", text: "text-xl" },
    lg: { ring: "w-24 h-24", inner: "w-12 h-12", dot: "w-2", text: "text-2xl" }
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`${fullScreen ? 'fixed inset-0 z-[200] bg-surface flex flex-col items-center justify-center' : 'w-full py-12 flex flex-col items-center justify-center'}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer Elegant Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={`${currentSize.ring} border-[1px] border-secondary/20 border-t-secondary rounded-full`}
        />
        
        {/* Inner Pulsing Circle */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute ${currentSize.inner} bg-secondary/10 rounded-full`}
        />

        {/* Small center dot */}
        <div className={`absolute ${currentSize.dot} aspect-square bg-secondary rounded-full shadow-[0_0_10px_rgba(115,92,0,0.5)]`} />
      </div>

      {showText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex flex-col items-center"
        >
          <span className={`font-headline ${currentSize.text} tracking-[0.2em] text-on-surface uppercase opacity-80`}>L'Essence</span>
          <div className="w-8 h-[1px] bg-secondary/30 mt-2" />
        </motion.div>
      )}
    </div>
  );
}
