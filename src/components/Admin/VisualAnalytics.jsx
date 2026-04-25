import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, ShoppingBag, Package, DollarSign, Users, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const VisualAnalytics = ({ orders = [], products = [] }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // 1. Process Sales Data for the Line/Area Chart
  const salesData = useMemo(() => {
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize current and last 5 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()];
      monthlyData[monthLabel] = { name: monthLabel, revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
      if (!order.timestamp) return;
      const date = new Date(order.timestamp);
      const monthLabel = months[date.getMonth()];
      if (monthlyData[monthLabel]) {
        const total = parseFloat(String(order.total || 0).replace(/[^0-9.-]+/g,"")) || 0;
        monthlyData[monthLabel].revenue += total;
        monthlyData[monthLabel].orders += 1;
      }
    });

    return Object.values(monthlyData);
  }, [orders]);

  // 2. Status Distribution (Pie Chart)
  const statusData = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      const s = o.status || 'Pending';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [orders]);

  const COLORS = ['#826a11', '#21804f', '#a69b91', '#e2e2e4', '#ef4444'];

  // 3. Top Products (Bar Chart)
  const topProducts = useMemo(() => {
    const productCounts = {};
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          productCounts[item.title] = (productCounts[item.title] || 0) + (item.quantity || 1);
        });
      }
    });
    return Object.keys(productCounts)
      .map(name => ({ name, sales: productCounts[name] }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [orders]);

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-[24px] border border-[#e2e2e4] shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all">
      <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91] mb-1">{title}</p>
          <h3 className="text-2xl font-noto-serif font-bold text-[#1a1c1d]">{value}</h3>
          {trend && (
            <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'} ${isRTL ? 'flex-row-reverse' : ''}`}>
              <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
              {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t('admin.dashboard.total_revenue')} 
          value={`${orders.reduce((sum, o) => sum + (parseFloat(String(o.total || 0).replace(/[^0-9.-]+/g,"")) || 0), 0).toLocaleString()} DZD`}
          icon={DollarSign}
          color="bg-amber-50 text-amber-600"
          trend={12}
        />
        <StatCard 
          title={t('admin.dashboard.active_orders')} 
          value={orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length}
          icon={ShoppingBag}
          color="bg-blue-50 text-blue-600"
          trend={5}
        />
        <StatCard 
          title={t('admin.dashboard.total_products')} 
          value={products.length}
          icon={Package}
          color="bg-stone-50 text-stone-600"
        />
        <StatCard 
          title="Avg. Order Value" 
          value={`${(orders.length ? (orders.reduce((sum, o) => sum + (parseFloat(String(o.total || 0).replace(/[^0-9.-]+/g,"")) || 0), 0) / orders.length) : 0).toFixed(0).toLocaleString()} DZD`}
          icon={Award}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend Chart */}
        <div className="bg-white p-8 rounded-[32px] border border-[#e2e2e4] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className={`text-xl font-noto-serif font-bold text-[#1a1c1d] mb-8 ${isRTL ? 'text-right' : ''}`}>Sales Performance</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#826a11" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#826a11" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#a69b91', fontWeight: 600 }}
                  reversed={isRTL}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#a69b91', fontWeight: 600 }}
                  orientation={isRTL ? 'right' : 'left'}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#826a11" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="bg-white p-8 rounded-[32px] border border-[#e2e2e4] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className={`text-xl font-noto-serif font-bold text-[#1a1c1d] mb-8 ${isRTL ? 'text-right' : ''}`}>Top Selling Perfumes</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#1a1c1d', fontWeight: 600 }}
                  width={100}
                  orientation={isRTL ? 'right' : 'left'}
                />
                <Tooltip 
                  cursor={{ fill: '#fbfaf9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="sales" fill="#d4b560" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Order Status Breakdown */}
        <div className="bg-white p-8 rounded-[32px] border border-[#e2e2e4] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className={`text-xl font-noto-serif font-bold text-[#1a1c1d] mb-8 ${isRTL ? 'text-right' : ''}`}>Order Mix</h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#1a1c1d]">{orders.length}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#a69b91] font-bold">Orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="md:col-span-2 bg-white p-8 rounded-[32px] border border-[#e2e2e4] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className={`text-xl font-noto-serif font-bold text-[#1a1c1d] mb-8 ${isRTL ? 'text-right' : ''}`}>Growth Indicator</h3>
          <div className="flex flex-col h-full justify-center pb-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <TrendingUp size={32} />
              </div>
              <div>
                <h4 className="text-4xl font-noto-serif font-bold text-[#1a1c1d]">+24%</h4>
                <p className="text-[#a69b91] text-xs font-bold uppercase tracking-widest">Growth this quarter</p>
              </div>
            </div>
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[#a69b91] uppercase tracking-widest">Customer Retention</span>
                    <span className="text-[#1a1c1d]">68%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#f0f0ef] rounded-full overflow-hidden">
                    <div className="h-full bg-[#826a11] rounded-full" style={{ width: '68%' }}></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[#a69b91] uppercase tracking-widest">Target Revenue</span>
                    <span className="text-[#1a1c1d]">82%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#f0f0ef] rounded-full overflow-hidden">
                    <div className="h-full bg-[#d4b560] rounded-full" style={{ width: '82%' }}></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualAnalytics;
