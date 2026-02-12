import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

/**
 * Hook to check user access and redirect to ChooseAccess if not authorized
 * User has access if:
 * 1. Role is 'admin' or 'contributor', OR
 * 2. Has an active Subscription (plan + status='active')
 */
export function useAccessControl() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await base44.auth.me();

        // Admin and contributor always have access
        if (user.role === 'admin' || user.role === 'contributor') {
          return;
        }

        // For regular users, check if they have an active subscription
        const subscriptions = await base44.entities.Subscription.filter({
          user_email: user.email,
          status: 'active'
        });

        if (subscriptions.length > 0) {
          // User has active subscription, allow access
          return;
        }

        // No active subscription, check for pending/rejected requests
        const requests = await base44.entities.JoinTeamRequest.filter({
          requester_email: user.email
        });

        if (requests.length > 0) {
          const status = requests[requests.length - 1].status;
          if (status === 'pending' || status === 'rejected') {
            navigate(createPageUrl("ChooseAccess"));
            return;
          }
        } else {
          // No subscription, no requests - redirect
          navigate(createPageUrl("ChooseAccess"));
          return;
        }
      } catch (error) {
        console.error("Error checking access:", error);
      }
    };

    checkAccess();
  }, [navigate]);
}