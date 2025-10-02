import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Receipt
} from "lucide-react";
import { useToast } from "../ui/use-toast";
import StaffLayout from "./StaffLayout";

const StaffPayments = () => {
  const { toast } = useToast();

  const pendingPayments = [
    {
      sessionId: "CS-001",
      station: "Downtown Station #1",
      connector: "A1",
      customer: "Tesla Model 3",
      duration: "1h 25m",
      energy: "42.5 kWh",
      cost: "$25.8",
      method: "Cash Payment",
      startTime: "15:45",
      endTime: "Now"
    },
    {
      sessionId: "CS-003",
      station: "Mall Station #2",
      connector: "B2", 
      customer: "BMW iX",
      duration: "1h 15m",
      energy: "38.2 kWh",
      cost: "$34.2",
      method: "Cash Payment",
      startTime: "14:30",
      endTime: "Now"
    },
    {
      sessionId: "CS-007",
      station: "Airport Station #3",
      connector: "C1",
      customer: "Audi e-tron",
      duration: "1h 10m",
      energy: "38.3 kWh",
      cost: "$22.5",
      method: "Payment Pending",
      startTime: "16:20",
      endTime: "Now"
    }
  ];

  const completedPayments = [
    {
      sessionId: "CS-005",
      station: "Downtown Station #1",
      connector: "A2",
      customer: "Nissan Leaf",
      amount: "$18.6",
      energy: "23.4 kWh",
      time: "13:20",
      staff: "John Anderson",
      method: "Cash"
    },
    {
      sessionId: "CS-006",
      station: "Mall Station #2",
      connector: "B1",
      customer: "Hyundai Kona",
      amount: "$15.2",
      energy: "19.8 kWh", 
      time: "12:45",
      staff: "John Anderson",
      method: "Cash"
    }
  ];

  const handleRecordPayment = (sessionId: string, amount: string) => {
    toast({
      title: "Payment Recorded",
      description: `Payment of ${amount} recorded for session ${sessionId}`,
      variant: "default"
    });
  };

  const handlePrintReceipt = (sessionId: string) => {
    toast({
      title: "Receipt Printed",
      description: `Receipt generated for session ${sessionId}`,
      variant: "default"
    });
  };

  const getMethodBadge = (method: string) => {
    const methodConfig = {
      "Cash Payment": { className: "bg-success/10 text-success border-success/20", text: "Cash Payment" },
      "Payment Pending": { className: "bg-warning/10 text-warning border-warning/20", text: "Payment Pending" },
      "Cash": { className: "bg-primary/10 text-primary border-primary/20", text: "Cash" }
    };
    
    const config = methodConfig[method as keyof typeof methodConfig];
    if (!config) return <Badge variant="outline">{method}</Badge>;
    
    return (
      <Badge className={config.className}>
        {config.text}
      </Badge>
    );
  };

  const paymentActions = (
    <>
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center px-3 py-1 bg-success/10 text-success rounded-lg">
          <DollarSign className="w-4 h-4 mr-1" />
          <span className="font-medium">$38.20</span>
          <span className="text-xs ml-1">Today's Collections</span>
        </div>
        <div className="flex items-center px-3 py-1 bg-warning/10 text-warning rounded-lg">
          <Clock className="w-4 h-4 mr-1" />
          <span className="font-medium">3</span>
          <span className="text-xs ml-1">Pending</span>
        </div>
      </div>
    </>
  );

  return (
    <StaffLayout title="Payment Management" actions={paymentActions}>
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card border-0 bg-gradient-to-br from-warning/5 to-warning/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold text-warning">3</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Collections</p>
                  <p className="text-2xl font-bold text-success">$38.20</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold text-primary">2</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Payments */}
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <AlertCircle className="w-5 h-5 mr-3 text-primary" />
              Pending Payments ({pendingPayments.length} sessions)
            </CardTitle>
            <p className="text-sm text-muted-foreground">Sessions requiring payment at the counter</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="font-semibold">Session Details</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Duration</TableHead>
                    <TableHead className="font-semibold">Energy</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((payment) => (
                    <TableRow key={payment.sessionId} className="border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{payment.sessionId}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {payment.station} • {payment.connector}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payment.startTime} - {payment.endTime}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-primary truncate max-w-32">{payment.customer}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{payment.duration}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-primary">{payment.energy}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-lg font-bold text-primary">{payment.cost}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => handleRecordPayment(payment.sessionId, payment.cost)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            Record Payment
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

        {/* Completed Payments */}
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <CheckCircle className="w-5 h-5 mr-3 text-primary" />
              Completed Payments
            </CardTitle>
            <p className="text-sm text-muted-foreground">Recent payments processed at this station</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="font-semibold">Session</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Energy</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Staff</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPayments.map((payment) => (
                    <TableRow key={payment.sessionId} className="border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{payment.sessionId}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {payment.station} • {payment.connector}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-primary truncate max-w-32">{payment.customer}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-lg font-bold text-success">{payment.amount}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-primary">{payment.energy}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{payment.time}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-primary font-medium">{payment.staff}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePrintReceipt(payment.sessionId)}
                            className="border-primary/20 text-primary hover:bg-primary/10"
                          >
                            <Receipt className="w-3 h-3 mr-1" />
                            Print Receipt
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
      </div>
    </StaffLayout>
  );
};

export default StaffPayments;