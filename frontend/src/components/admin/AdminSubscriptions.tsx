import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { 
  Search,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Battery,
  Clock,
  UserCheck,
  TrendingUp,
  Package
} from "lucide-react";
import AdminLayout from "./AdminLayout";

const AdminSubscriptions = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const packages = [
    {
      id: 1,
      name: "Basic Monthly",
      description: "Perfect for occasional EV drivers",
      price: "$29.99",
      period: "per 1 month",
      limits: {
        kwh: "200 kWh",
        sessions: "20 sessions"
      },
      subscribers: 1245,
      revenue: "$37,197.55",
      status: "Active"
    },
    {
      id: 2,
      name: "Premium Monthly",
      description: "For regular commuters and road trip enthusiasts", 
      price: "$59.99",
      period: "per 1 month",
      limits: {
        kwh: "500 kWh", 
        sessions: "50 sessions"
      },
      subscribers: 856,
      revenue: "$51,350.44",
      status: "Active"
    },
    {
      id: 3,
      name: "Enterprise Annual",
      description: "Comprehensive solution for fleet management",
      price: "$1999.99", 
      period: "per 12 months",
      limits: {
        kwh: "10000 kWh",
        sessions: "1000 sessions"
      },
      subscribers: 89,
      revenue: "$177,999.11",
      status: "Active"
    },
    {
      id: 4,
      name: "Student Discount",
      description: "Special pricing for students",
      price: "$19.99",
      period: "per 1 month", 
      limits: {
        kwh: "150 kWh",
        sessions: "15 sessions"
      },
      subscribers: 234,
      revenue: "$4,677.66", 
      status: "Inactive"
    }
  ];

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = packages.reduce((sum, pkg) => 
    sum + parseFloat(pkg.revenue.replace(/[$,]/g, '')), 0
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'Inactive':
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const subscriptionActions = (
    <>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input 
          placeholder="Search packages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-80"
        />
      </div>
      
      <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
        <UserCheck className="w-4 h-4 mr-2" />
        Assign to Users
      </Button>

      <Button className="bg-success text-success-foreground hover:bg-success/90">
        <Plus className="w-4 h-4 mr-2" />
        Create Package
      </Button>
    </>
  );

  return (
    <AdminLayout title="Subscription Management" actions={subscriptionActions}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Packages</p>
                <p className="text-2xl font-bold text-primary">{packages.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
                <p className="text-2xl font-bold text-success">
                  {packages.reduce((sum, pkg) => sum + pkg.subscribers, 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold text-warning">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-secondary/5 to-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Packages</p>
                <p className="text-2xl font-bold text-secondary">
                  {packages.filter(pkg => pkg.status === 'Active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Packages */}
      <Card className="shadow-card border-0 bg-gradient-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Package className="w-5 h-5 mr-3 text-primary" />
            Subscription Packages ({filteredPackages.length} packages)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="font-semibold">Package Details</TableHead>
                  <TableHead className="font-semibold">Pricing</TableHead>
                  <TableHead className="font-semibold">Usage Limits</TableHead>
                  <TableHead className="font-semibold">Subscribers</TableHead>
                  <TableHead className="font-semibold">Revenue</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg) => (
                  <TableRow key={pkg.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{pkg.name}</div>
                        <div className="text-sm text-muted-foreground">{pkg.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-bold text-lg text-primary">{pkg.price}</div>
                        <div className="text-sm text-muted-foreground">{pkg.period}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm bg-primary/5 px-2 py-1 rounded">
                          <Battery className="w-3 h-3 mr-1 text-primary" />
                          <span className="font-medium">{pkg.limits.kwh}</span>
                        </div>
                        <div className="flex items-center text-sm bg-muted/50 px-2 py-1 rounded">
                          <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                          <span>{pkg.limits.sessions}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-foreground">
                          {pkg.subscribers}
                        </div>
                        <div className="text-xs text-muted-foreground">users</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-lg font-semibold text-success">
                        {pkg.revenue}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(pkg.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminSubscriptions;