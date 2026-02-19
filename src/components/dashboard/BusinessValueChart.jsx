import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function BusinessValueChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        Aucune donnée disponible
      </div>
    );
  }

  const chartData = data.map((metric) => ({
    period: `${format(parseISO(metric.period_start_date), "MMM yy", { locale: fr })} - ${format(parseISO(metric.period_end_date), "MMM yy", { locale: fr })}`,
    "Valeur Livrée": metric.value_delivered,
    "Valeur Planifiée": metric.value_planned,
  }));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={formatCurrency}
            contentStyle={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
            }}
          />
          <Legend />
          <Bar dataKey="Valeur Livrée" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Valeur Planifiée" fill="#94a3b8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}