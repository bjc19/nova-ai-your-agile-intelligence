import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { Bell, AlertCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export default function AdminNotificationsPanel({ pendingAlerts }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [sprintAlerts, setSprintAlerts] = useState([]);
  const [connectionErrors, setConnectionErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const sprints = await base44.entities.SprintHealth.filter({
        status: "critical",
      });
      setSprintAlerts(sprints || []);

      const errors = [];
      const sources = [
        { entity: "JiraConnection", name: "Jira" },
        { entity: "TrelloConnection", name: "Trello" },
        { entity: "ConfluenceConnection", name: "Confluence" },
        { entity: "SlackConnection", name: "Slack" },
        { entity: "TeamsConnection", name: "Teams" },
      ];

      for (const source of sources) {
        const errs = await base44.entities[source.entity].filter({
          connection_status_error: true,
        });
        if (errs && errs.length > 0) {
          errors.push(
            ...errs.map((err) => ({
              ...err,
              source: source.name,
            }))
          );
        }
      }
      setConnectionErrors(errors);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const totalNotifications = sprintAlerts.length + connectionErrors.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative text-slate-600 hover:text-slate-900 transition-colors">
          <Bell className="w-5 h-5" />
          {pendingAlerts > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingAlerts > 9 ? "9+" : pendingAlerts}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-900">Notifications</h2>

          {isLoading ? (
            <div className="text-center py-6 text-slate-500">
              Chargement...
            </div>
          ) : totalNotifications === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('noNotificationFound')}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {/* Sprint Health Alerts */}
              {sprintAlerts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-600 uppercase">
                    Sprint Health
                  </h3>
                  {sprintAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-lg bg-red-50 border border-red-200"
                    >
                      <p className="text-sm font-medium text-red-900">
                        {alert.sprint_name}
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Risk score: {alert.risk_score}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Connection Errors */}
              {connectionErrors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-600 uppercase">
                    Integration Errors
                  </h3>
                  {connectionErrors.map((error) => (
                    <div
                      key={error.id}
                      className="p-3 rounded-lg bg-amber-50 border border-amber-200"
                    >
                      <div className="flex items-start gap-2">
                        <Badge className="shrink-0 bg-amber-100 text-amber-800 text-xs">
                          {error.source}
                        </Badge>
                      </div>
                      <p className="text-xs text-amber-900 mt-2">
                        {error.connection_error_message}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        {new Date(
                          error.connection_error_timestamp
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}