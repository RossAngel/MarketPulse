import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "./styles.css";
function Sparkline({ data }) {
  const chartData = data.map((val, index) => ({
    day: `D${index + 1}`,
    return: val
  }));

  return (
    <div className="chart-container">
      <h3 className="mb-2">5-Day Return Sparkline</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <XAxis dataKey="day" stroke="#ccc" />
          <YAxis domain={['auto', 'auto']} stroke="#ccc" />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--metal-dark)',
              borderColor: 'var(--accent)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="return" 
            stroke="var(--accent)" 
            strokeWidth={2} 
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Sparkline;