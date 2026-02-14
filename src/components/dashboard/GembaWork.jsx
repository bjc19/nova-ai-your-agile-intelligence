import { motion } from "framer-motion";
import MyFocusBoard from "@/components/dashboard/MyFocusBoard";
import BlockersAffectingMe from "@/components/dashboard/BlockersAffectingMe";
import ContributionMetrics from "@/components/dashboard/ContributionMetrics";
import PrioritizedBacklog from "@/components/dashboard/PrioritizedBacklog";

export default function GembaWork() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <MyFocusBoard />
      <PrioritizedBacklog />
      <BlockersAffectingMe />
      <ContributionMetrics />
    </motion.div>
  );
}