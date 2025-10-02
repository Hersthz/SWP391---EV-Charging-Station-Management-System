import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  CreditCard,
  Car,
  X
} from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type NotificationType = 'success' | 'warning' | 'info' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: any;
}

const NotificationModal = ({ isOpen, onClose }: NotificationModalProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Charging complete',
      message: 'Session at Downtown Station #3 finished successfully. Energy added: 45.8 kWh',
      time: '2 minutes ago',
      read: false,
      icon: CheckCircle
    },
    {
      id: '2',
      type: 'info',
      title: 'Payment successful',
      message: 'Payment of $28.50 for the session was processed successfully',
      time: '5 minutes ago',
      read: false,
      icon: CreditCard
    },
    {
      id: '3',
      type: 'warning',
      title: 'Reservation expiring soon',
      message: 'Your reservation at Central Mall will expire in 10 minutes',
      time: '15 minutes ago',
      read: false,
      icon: Clock
    },
    {
      id: '4',
      type: 'info',
      title: 'EV connected',
      message: 'Tesla Model 3 connected and started charging',
      time: '1 hour ago',
      read: true,
      icon: Car
    },
    {
      id: '5',
      type: 'success',
      title: 'New station available',
      message: 'A new station at Tech Park is now open with promotional pricing',
      time: '2 hours ago',
      read: true,
      icon: Zap
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <DialogTitle>Notifications</DialogTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-primary"
            >
              Mark all as read
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {notifications.map((notification) => {
              const IconComponent = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${notification.read
                      ? 'bg-background border-border/50'
                      : 'bg-primary/5 border-primary/20 shadow-sm'
                    }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-medium text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;
