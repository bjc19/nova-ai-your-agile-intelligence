import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

const SAMPLE_TRANSCRIPT = `Daily Scrum - Sprint 14 - March 15, 2024

Sarah (Frontend Dev):
"Yesterday I finished the user dashboard components. Today I'm starting on the notification system. No blockers."

Mike (Backend Dev):
"I'm still stuck on the payment integration. The third-party API documentation is unclear and I've been waiting for their support team to respond for 2 days now. This is blocking the checkout feature."

Lisa (QA Engineer):
"I completed testing for the login flow. Found 3 bugs, all logged in Jira. Today I'll start testing the product catalog. I need Mike to deploy the latest backend changes to staging first."

Tom (Full Stack):
"Working on the search functionality. I realized we need additional database indexes, but I don't have the permissions to add them. Also, I noticed Sarah and I might have some conflicting changes on the header component."

Emma (Product Owner):
"Quick reminder - the client demo is in 4 days. We need the checkout flow working by then. Mike, what's your estimate on the payment integration?"

Mike (Backend Dev):
"Honestly, if I don't hear back from the API provider today, we might need to consider an alternative solution. It could delay us by a week."`;

export default function TranscriptInput({ value, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-3"
    >
      <div>
        <label className="text-sm font-medium text-slate-700">
          Meeting Transcript
        </label>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your Daily Scrum transcript here, or click 'Load sample transcript' to see Nova in action..."
        className="min-h-[400px] resize-none rounded-xl border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
      />
      <p className="text-xs text-slate-500">
        In the full version, Nova connects directly to Zoom and Microsoft Teams to capture this automatically.
      </p>
    </motion.div>
  );
}

export { SAMPLE_TRANSCRIPT };