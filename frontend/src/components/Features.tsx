import { MapPin, Zap, CreditCard, Clock, Smartphone, Battery } from "lucide-react";
import { Card } from "../components/ui/card";

const Features = () => {
  const features = [
    {
      icon: MapPin,
      title: "Tìm trạm theo thời gian thực",
      description: "Định vị các trạm sạc gần bạn với thông tin tình trạng và giá cả chính xác.",
      color: "text-primary"
    },
    {
      icon: Zap,
      title: "Mạng lưới sạc nhanh",
      description: "Truy cập vào mạng lưới sạc nhanh lớn nhất với tốc độ lên đến 350kW.",
      color: "text-accent"
    },
    {
      icon: CreditCard,
      title: "Thanh toán liền mạch",
      description: "Thanh toán trực tiếp qua ứng dụng với hóa đơn tự động và lịch sử chi tiết.",
      color: "text-primary"
    },
    {
      icon: Clock,
      title: "Lên lịch thông minh",
      description: "Đặt lịch phiên sạc trước và nhận thông báo khi điểm sạc sẵn sàng.",
      color: "text-accent"
    },
    {
      icon: Smartphone,
      title: "Giám sát từ xa",
      description: "Theo dõi phiên sạc của bạn từ xa và nhận thông báo khi hoàn tất.",
      color: "text-primary"
    },
    {
      icon: Battery,
      title: "Phân tích pin",
      description: "Theo dõi tình trạng pin, thói quen sạc và tối ưu hóa để đạt hiệu suất cao nhất.",
      color: "text-accent"
    }
  ];

  return (
    <section className="py-24 px-4 bg-gradient-section">
      <div className="container mx-auto max-w-7xl">
        {/* Tiêu đề Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary mb-4">
            <Zap className="w-6 h-6" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Tính năng mạnh mẽ
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Mọi thứ bạn cần cho
            <span className="block text-primary">Sạc xe điện thông minh</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Nền tảng toàn diện của chúng tôi mang đến tất cả công cụ bạn cần để quản lý việc sạc xe điện hiệu quả và tiện lợi.
          </p>
        </div>

        {/* Lưới tính năng */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-8 bg-gradient-card border-0 shadow-card hover:shadow-primary transition-all duration-300 hover:-translate-y-2 group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="space-y-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-hero flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
