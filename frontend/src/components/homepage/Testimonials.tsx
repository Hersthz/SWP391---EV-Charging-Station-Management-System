import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Nguyễn Văn An",
      role: "Chủ xe Tesla Model 3",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      content: "Ứng dụng này thật sự thay đổi cách tôi sạc xe điện. Tìm trạm nhanh, đặt chỗ dễ dàng và thanh toán tự động. Tuyệt vời!",
      rating: 5,
      verified: true
    },
    {
      name: "Trần Thị Hương",
      role: "Tài xế VinFast VF8",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      content: "Từ khi dùng ChargeStation, tôi không còn lo hết pin giữa đường. Mạng lưới trạm sạc rộng khắp và luôn ổn định.",
      rating: 5,
      verified: true
    },
    {
      name: "Lê Minh Khôi",
      role: "Chủ xe BMW iX",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      content: "Tính năng lên lịch cực kỳ tiện. Tôi có thể lên kế hoạch chuyến đi dài mà không lo điểm dừng sạc. Dịch vụ 5 sao!",
      rating: 5,
      verified: true
    }
  ];

  return (
    <section className="py-24 px-4 bg-gradient-section">
      <div className="container mx-auto max-w-7xl">
        {/* Tiêu đề Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary mb-4">
            <Quote className="w-6 h-6" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Khách hàng nói gì
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Được tin tưởng bởi
            <span className="block text-primary">Hàng nghìn tài xế</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Khám phá trải nghiệm thực tế từ những tài xế EV sử dụng ChargeStation mỗi ngày.
          </p>
        </div>

        {/* Lưới đánh giá */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="p-6 bg-gradient-card border-0 shadow-card hover:shadow-primary transition-all duration-300 hover:-translate-y-2 group animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-0 space-y-6">
                {/* Xếp hạng */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Trích dẫn */}
                <div className="relative">
                  <Quote className="w-8 h-8 text-primary/20 absolute -top-2 -left-2" />
                  <p className="text-muted-foreground leading-relaxed italic pl-6">
                    "{testimonial.content}"
                  </p>
                </div>

                {/* Thông tin người dùng */}
                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                  <div className="relative">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {testimonial.verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      {testimonial.verified && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                          Đã xác thực
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lời kêu gọi (CTA) cuối */}
        <div className="text-center mt-16">
          <div className="bg-gradient-hero/10 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Tham gia cộng đồng của chúng tôi
            </h3>
            <p className="text-muted-foreground mb-6">
              Hơn 50.000 tài xế tin dùng ChargeStation cho mọi hành trình
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>Đánh giá 4.9/5</span>
              </div>
              <div>•</div>
              <div>2M+ phiên sạc thành công</div>
              <div>•</div>
              <div>99.9% thời gian hoạt động</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
