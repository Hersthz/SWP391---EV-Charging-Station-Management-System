// src/pages/admin/AdminDashboard.tsx
import { useState, useEffect, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  BarChart3,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import { motion, type Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Helper lấy giờ và ngày
const useCurrentDateTime = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    time: timeFormatter.format(dateTime),
    date: dateFormatter.format(dateTime),
  };
};

// Dữ liệu mock cho Alerts
const alerts = [
  {
    id: 1,
    type: "error",
    message: "Station DT-003 offline for 2 hours",
    time: "15 min ago",
    priority: "high",
  },
  {
    id: 2,
    type: "warning",
    message: "Low utilization at Airport Station #1",
    time: "1 hour ago",
    priority: "medium",
  },
  {
    id: 3,
    type: "success",
    message: "Scheduled maintenance completed at Mall Station #2",
    time: "3 hours ago",
    priority: "low",
  },
];

// Variants cho animation
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.42, 0, 0.58, 1],
    },
  },
};

const AdminDashboard = () => {
  const { time, date } = useCurrentDateTime();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500 flex-shrink-0" />;
    }
  };

  const getAlertBorder = (type: string) => {
    switch (type) {
      case "error":
        return "border-l-red-500";
      case "warning":
        return "border-l-yellow-500";
      case "success":
        return "border-l-emerald-500";
      default:
        return "border-l-slate-400";
    }
  };

  return (
    <AdminLayout title="Dashboard Overview">
      <div className="w-full h-full bg-slate-100 text-slate-900">
        
        {/* === Hero Welcome Card === */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className="mb-8 bg-gradient-to-r from-emerald-900 via-cyan-900 to-sky-900 border-0 shadow-2xl shadow-cyan-900/20 rounded-3xl text-white overflow-hidden">
            <CardContent className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Phần Chào mừng */}
              <div className="md:col-span-2">
                <motion.h1
                  className="text-5xl font-extrabold tracking-tighter mb-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Welcome back, <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Admin!</span>
                </motion.h1>
                <motion.p
                  className="text-2xl text-cyan-100/80 mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  Here's your command center overview for today.
                </motion.p>
                <motion.div
                  className="text-lg font-medium text-cyan-100/60"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <span className="font-bold text-white">{time}</span> • {date}
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* === Quick Actions & Live Feed === */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Quick Actions */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <Card className="shadow-2xl shadow-slate-900/10 border-0 rounded-2xl h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center text-slate-900">
                  <Zap className="w-5 h-5 mr-2 text-emerald-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ActionCard
                  title="Manage Stations"
                  description="View live status, utilization, and errors."
                  icon={<MapPin className="w-6 h-6 text-blue-600" />}
                  color="blue"
                  href="/admin/stations"
                />
                <ActionCard
                  title="Manage Users"
                  description="Edit roles, suspend, or add new users."
                  icon={<Users className="w-6 h-6 text-emerald-600" />}
                  color="emerald"
                  href="/admin/users"
                />
                <ActionCard
                  title="View Reports"
                  description="Analyze revenue, sessions, and growth."
                  icon={<BarChart3 className="w-6 h-6 text-purple-600" />}
                  color="purple"
                  href="/admin/reports"
                />
                <ActionCard
                  title="Manage Staff"
                  description="Add new staff or manage permissions."
                  icon={<Shield className="w-6 h-6 text-red-600" />}
                  color="red"
                  href="/admin/staff" 
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Live System Feed */}
          <motion.div className="lg:col-span-1" variants={itemVariants}>
            <Card className="shadow-2xl shadow-slate-900/10 border-0 rounded-2xl h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center text-slate-900">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                  Live System Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.map((a) => (
                  <motion.div
                    key={a.id}
                    whileHover={{ scale: 1.03 }}
                    className={`
                      relative overflow-hidden rounded-xl border-l-4
                      ${getAlertBorder(a.type)}
                      bg-slate-100/80 border border-slate-200/80
                      p-4 transition-all duration-200 ease-out
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(a.type)}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{a.message}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {a.time}
                          </span>
                          <Badge
                            variant={
                              a.priority === "high" ? "destructive" :
                              a.priority === "medium" ? "secondary" : "outline"
                            }
                            className="text-xs px-2 py-0.5 rounded-full capitalize"
                          >
                            {a.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

      </div>
    </AdminLayout>
  );
};

// Component thẻ hành động
type ActionCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  color: "blue" | "emerald" | "purple" | "red";
  href: string;
};

const ActionCard = ({ title, description, icon, color, href }: ActionCardProps) => {
  const navigate = useNavigate();
  const colors = {
    blue: { bg: "bg-blue-100/70", text: "text-blue-600", shadow: "hover:shadow-blue-500/20" },
    emerald: { bg: "bg-emerald-100/70", text: "text-emerald-600", shadow: "hover:shadow-emerald-500/20" },
    purple: { bg: "bg-purple-100/70", text: "text-purple-600", shadow: "hover:shadow-purple-500/20" },
    red: { bg: "bg-red-100/70", text: "text-red-600", shadow: "hover:shadow-red-500/20" },
  };
  const c = colors[color];

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2, ease: "easeOut" } }}
      className={`group relative p-5 bg-slate-100/30 hover:bg-white rounded-2xl border border-slate-200/80 
                  transition-all duration-300 cursor-pointer ${c.shadow} hover:shadow-2xl`}
      onClick={() => navigate(href)}
    >
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      <ArrowRight className="w-5 h-5 text-slate-400 absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};

export default AdminDashboard;