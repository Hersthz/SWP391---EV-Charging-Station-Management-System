import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import {
  Search,
  UserPlus,
  Edit,
  UserX,
  Mail,
  Phone,
  Filter,
  MoreHorizontal,
  Shield,
  Calendar,
  CheckCircle
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { toast } from "../../components/ui/use-toast";
const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all-roles");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [roleEditorOpen, setRoleEditorOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "basic",
    subscription: "pay-per-use"
  });
  const [addUserOpen, setAddUserOpen] = useState(false);
  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+1 (555) 123-4567",
      joinDate: "2023-01-15",
      role: "Premium User",
      status: "Active",
      sessions: 147,
      subscription: "Premium Monthly"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1 (555) 234-5678",
      joinDate: "2023-03-22",
      role: "Basic User",
      status: "Active",
      sessions: 89,
      subscription: "Pay-per-use"
    },
    {
      id: 3,
      name: "Mike Chen",
      email: "mike.chen@company.com",
      phone: "+1 (555) 345-6789",
      joinDate: "2022-11-08",
      role: "Fleet Manager",
      status: "Active",
      sessions: 523,
      subscription: "Enterprise"
    },
    {
      id: 4,
      name: "Emma Wilson",
      email: "emma.w@email.com",
      phone: "+1 (555) 456-7890",
      joinDate: "2024-02-14",
      role: "Basic User",
      status: "Suspended",
      sessions: 23,
      subscription: "Basic Monthly"
    }
  ];

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.phone) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "User Created Successfully",
      description: `${newUser.name} has been added to the system`,
    });

    setAddUserOpen(false);
    setNewUser({
      name: "",
      email: "",
      phone: "",
      role: "basic",
      subscription: "pay-per-use"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'Suspended':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'Premium User': {
        className: "bg-warning/10 text-warning border-warning/20",
        icon: "⭐",
        text: "Premium User"
      },
      'Fleet Manager': {
        className: "bg-primary/10 text-primary border-primary/20",
        icon: "🚗",
        text: "Fleet Manager"
      },
      'Basic User': {
        className: "bg-muted/50 text-muted-foreground border-muted",
        icon: "👤",
        text: "Basic User"
      }
    };

    const config = roleConfig[role as keyof typeof roleConfig];
    if (!config) return <Badge variant="outline">{role}</Badge>;

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <span>{config.icon}</span>
        {config.text}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all-roles" ||
      (roleFilter === "basic" && user.role === "Basic User") ||
      (roleFilter === "premium" && user.role === "Premium User") ||
      (roleFilter === "fleet" && user.role === "Fleet Manager");
    const matchesStatus = statusFilter === "all-status" ||
      user.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const userActions = (
    <>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-80"
        />
      </div>

      <Select value={roleFilter} onValueChange={setRoleFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-roles">All Roles</SelectItem>
          <SelectItem value="basic">Basic User</SelectItem>
          <SelectItem value="premium">Premium User</SelectItem>
          <SelectItem value="fleet">Fleet Manager</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-status">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={roleEditorOpen} onOpenChange={setRoleEditorOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
            <Shield className="w-4 h-4 mr-2" />
            Role Editor
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <Shield className="w-5 h-5 mr-2 text-primary" />
              Role Management System
            </DialogTitle>
            <DialogDescription>
              Manage user roles and permissions for the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-3xl">👤</div>
                    <h3 className="font-semibold text-foreground">Basic User</h3>
                    <p className="text-xs text-muted-foreground">Standard access to charging stations</p>
                    <Badge variant="outline" className="text-xs">
                      {users.filter(u => u.role === "Basic User").length} users
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-warning/20 bg-warning/5">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-3xl">⭐</div>
                    <h3 className="font-semibold text-foreground">Premium User</h3>
                    <p className="text-xs text-muted-foreground">Priority access & discounts</p>
                    <Badge variant="outline" className="text-xs">
                      {users.filter(u => u.role === "Premium User").length} users
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-secondary/20 bg-secondary/5">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-3xl">🚗</div>
                    <h3 className="font-semibold text-foreground">Fleet Manager</h3>
                    <p className="text-xs text-muted-foreground">Manage multiple vehicles</p>
                    <Badge variant="outline" className="text-xs">
                      {users.filter(u => u.role === "Fleet Manager").length} users
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">Role Permissions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Access charging stations</span>
                  <div className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <CheckCircle className="w-4 h-4 text-success" />
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Priority booking</span>
                  <div className="flex gap-2">
                    <span className="w-4 h-4 text-muted-foreground">—</span>
                    <CheckCircle className="w-4 h-4 text-success" />
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Fleet management</span>
                  <div className="flex gap-2">
                    <span className="w-4 h-4 text-muted-foreground">—</span>
                    <span className="w-4 h-4 text-muted-foreground">—</span>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setRoleEditorOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogTrigger asChild>
          <Button
            className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 text-primary-foreground hover:opacity-90 shadow-electric"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <UserPlus className="w-5 h-5 mr-2 text-primary" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account with basic information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@email.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">User Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic User</SelectItem>
                    <SelectItem value="premium">Premium User</SelectItem>
                    <SelectItem value="fleet">Fleet Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription" className="text-sm font-medium">Subscription</Label>
                <Select value={newUser.subscription} onValueChange={(value) => setNewUser({ ...newUser, subscription: value })}>
                  <SelectTrigger id="subscription">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pay-per-use">Pay-per-use</SelectItem>
                    <SelectItem value="basic">Basic Monthly</SelectItem>
                    <SelectItem value="premium">Premium Monthly</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>
              Cancel
            </Button>
            <Button
  onClick={handleAddUser}
  className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 text-primary-foreground hover:brightness-110 active:translate-y-[1px] focus-visible:ring-2 focus-visible:ring-primary/50 shadow-electric transition-all"
>
  Create User
</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <AdminLayout title="User Management" actions={userActions}>
      {/* User Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-primary">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-success">
                  {users.filter(u => u.status === 'Active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Premium Users</p>
                <p className="text-2xl font-bold text-warning">
                  {users.filter(u => u.role === 'Premium User').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <span className="text-xl">⭐</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-to-br from-secondary/5 to-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fleet Managers</p>
                <p className="text-2xl font-bold text-secondary">
                  {users.filter(u => u.role === 'Fleet Manager').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <span className="text-xl">🚗</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <Card className="shadow-card border-0 bg-gradient-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <span className="text-xl mr-3">👥</span>
            User Management ({filteredUsers.length} users)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="font-semibold">User Details</TableHead>
                  <TableHead className="font-semibold">Contact Info</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Activity</TableHead>
                  <TableHead className="font-semibold">Subscription</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Joined {user.joinDate}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-2 text-muted-foreground" />
                          <span className="text-primary font-medium">{user.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="w-3 h-3 mr-2" />
                          <span>{user.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-primary">
                          {user.sessions}
                        </div>
                        <div className="text-xs text-muted-foreground">sessions</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">
                        {user.subscription}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={user.status === 'Active'
                            ? 'text-destructive border-destructive/20 hover:bg-destructive/10'
                            : 'text-success border-success/20 hover:bg-success/10'}
                        >
                          <UserX className="w-3 h-3 mr-1" />
                          {user.status === 'Active' ? 'Suspend' : 'Activate'}
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

export default AdminUsers;