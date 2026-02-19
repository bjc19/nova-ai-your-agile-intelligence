import { motion } from "framer-motion";

export default function SectionSkeleton({ height = "h-40" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${height} bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-lg overflow-hidden`}
    >
      <motion.div
        animate={{ x: ["100%", "-100%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />
    </motion.div>
  );
}