import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function CategoryChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted/50 rounded-2xl border border-dashed border-border">
        <span className="text-muted-foreground text-sm italic font-medium">Aucune donnée ce mois</span>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={8}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              borderRadius: '20px', 
              border: 'none', 
              backgroundColor: 'var(--foreground)',
              color: 'var(--background)',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            itemStyle={{ color: 'var(--background)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}