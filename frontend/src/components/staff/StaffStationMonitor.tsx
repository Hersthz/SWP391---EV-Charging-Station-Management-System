import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from  "../ui/progress";
import {
  Power,
  Play,
  Square,
  Wrench,
  Activity,
  Wifi,
  Clock,
  User
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import StaffLayout from "./StaffLayout";

const StaffStation = () => {
  const { toast } = useToast();

  const stations = [
    {
      id: "dt-001",
      name: "Downtown Station #1",
      location: "123 Main St, Downtown",
      status: "online",
      connectors: [
        {
          id: "A1",
          type: "Type 2",
          power: "22 kW",
          status: "charging",
          customer: "Tesla Model 3",
          startTime: "14:30",
          energy: "23.4 kWh",
          cost: "$15.2",
          progress: 75,
          estimatedTime: "25 min"
        },
        {
          id: "A2",
          type: "CCS",
          power: "50 kW", 
          status: "available",
          customer: null,
          startTime: null,
          energy: null,
          cost: null,
          progress: 0,
          estimatedTime: null
        },
        {
          id: "A3",
          type: "Type 2",
          power: "22 kW",
          status: "maintenance",
          customer: null,
          startTime: null,
          energy: null,
          cost: null,
          progress: 0,
          estimatedTime: null
        }
      ]
    },
    {
      id: "ml-002",
      name: "Mall Station #2",
      location: "Shopping Mall, Level B1",
      status: "online",
      connectors: [
        {
          id: "B1",
          type: "Type 2",
          power: "22 kW",
          status: "available",
          customer: null,
          startTime: null,
          energy: null,
          cost: null,
          progress: 0,
          estimatedTime: null
        },
        {
          id: "B2",
          type: "CCS",
          power: "50 kW",
          status: "charging",
          customer: "BMW iX",
          startTime: "13:45",
          energy: "38.2 kWh",
          cost: "$34.2",
          progress: 90,
          estimatedTime: "10 min"
        }
      ]
    }
  ];

  const handleStartSession = (stationId: string, connectorId: string) => {
    toast({
      title: "Session Started",
      description: `Charging session started on ${stationId} - ${connectorId}`,
      variant: "default"
    });
  };

  const handleStopSession = (stationId: string, connectorId: string) => {
    toast({
      title: "Session Stopped",
      description: `Charging session stopped on ${stationId} - ${connectorId}`,
      variant: "default"
    });
  };

  const handleReportIssue = (stationId: string, connectorId: string) => {
    toast({
      title: "Issue Reported",
      description: `Maintenance request submitted for ${stationId} - ${connectorId}`,
      variant: "default"
    });
  };

  const getConnectorStatusBadge = (status: string) => {
    const statusConfig = {
      charging: { 
        className: "bg-success/10 text-success border-success/20", 
        icon: Activity, 
        text: "Charging" 
      },
      available: { 
        className: "bg-primary/10 text-primary border-primary/20", 
        icon: Wifi, 
        text: "Available" 
      },
      maintenance: { 
        className: "bg-warning/10 text-warning border-warning/20", 
        icon: Wrench, 
        text: "Maintenance" 
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    
    const Icon = config.icon;
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const stationActions = (
    <>
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
        <Power className="w-4 h-4 mr-2" />
        Start Session
      </Button>
    </>
  );

  return (
    <StaffLayout title="Station Management" actions={stationActions}>
      <div className="space-y-8">
        {stations.map((station) => (
          <Card key={station.id} className="shadow-card border-0 bg-gradient-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-lg">
                    <Power className="w-5 h-5 mr-3 text-primary" />
                    {station.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{station.location}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-success/10 text-success border-success/20 flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    Online
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {station.connectors.map((connector) => (
                  <div 
                    key={connector.id}
                    className="p-4 bg-muted/20 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors min-w-0"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Power className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">Connector {connector.id}</div>
                          <div className="text-xs text-muted-foreground">
                            {connector.type} • {connector.power}
                          </div>
                        </div>
                      </div>
                      {getConnectorStatusBadge(connector.status)}
                    </div>

                    {connector.status === "charging" && connector.customer && (
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-foreground font-medium">{connector.customer}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{connector.startTime}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-foreground">{connector.progress}%</span>
                          </div>
                          <Progress 
                            value={connector.progress} 
                            className="h-2"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="min-w-0">
                            <div className="text-muted-foreground text-xs">Energy</div>
                            <div className="font-medium text-primary truncate">{connector.energy}</div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-muted-foreground text-xs">Cost</div>
                            <div className="font-medium text-primary truncate">{connector.cost}</div>
                          </div>
                        </div>

                        {connector.estimatedTime && (
                          <div className="text-xs text-muted-foreground text-center">
                            Est. completion: {connector.estimatedTime}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col space-y-2">
                      {connector.status === "available" && (
                        <Button 
                          size="sm"
                          onClick={() => handleStartSession(station.id, connector.id)}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Play className="w-3 h-3 mr-2" />
                          Start Session
                        </Button>
                      )}

                      {connector.status === "charging" && (
                        <Button 
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStopSession(station.id, connector.id)}
                          className="w-full"
                        >
                          <Square className="w-3 h-3 mr-2" />
                          Stop
                        </Button>
                      )}

                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleReportIssue(station.id, connector.id)}
                        className="w-full border-warning/20 text-warning hover:bg-warning/10"
                      >
                        <Wrench className="w-3 h-3 mr-2" />
                        Report Issue
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </StaffLayout>
  );
};

export default StaffStation;