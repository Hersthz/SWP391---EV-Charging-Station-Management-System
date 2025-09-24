import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Zap, MapPin, Battery, Shield, Clock, Star, Users, TrendingUp, ArrowRight, Play } from "lucide-react";
import heroImage from "../assets/hero-charging.jpg";
import heroBackground from "../assets/hero-background.jpg";

const Hero = () => {
  return (
    <>
      {/* Khu vực Hero chính */}
      <section 
        className="min-h-screen flex items-center justify-center py-20 px-4 pt-36 relative overflow-hidden"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Lớp phủ màu */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-secondary/60 to-accent/70 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-tertiary/20 via-transparent to-primary-glow/30"></div>
        
        {/* Hiệu ứng nền động */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-primary-glow/30 to-secondary/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-accent/25 to-tertiary/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-to-r from-secondary/20 to-primary/15 rounded-full blur-2xl animate-float" style={{ animationDelay: "4s" }}></div>
          <div className="absolute top-3/4 left-1/3 w-72 h-72 bg-gradient-to-bl from-tertiary/20 to-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "6s" }}></div>
          <div className="absolute bottom-1/3 left-3/4 w-56 h-56 bg-gradient-to-tr from-success/25 to-primary-glow/15 rounded-full blur-2xl animate-float" style={{ animationDelay: "8s" }}></div>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Nội dung Hero */}
            <div className="text-white space-y-8 animate-fade-in">
              <div className="flex items-center gap-3 text-tertiary mb-6">
                <div className="w-8 h-8 bg-gradient-rainbow rounded-lg flex items-center justify-center shadow-lg shadow-tertiary/30">
                  <Zap className="w-5 h-5 text-white animate-pulse" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-widest text-white/90">
                  Tương lai sạc xe điện
                </span>
                <Badge variant="secondary" className="bg-gradient-sunset text-white border-none shadow-lg">
                  V3.0 ⚡
                </Badge>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight">
                <span className="block bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent drop-shadow-lg">
                  Nạp năng lượng
                </span>
                <span className="block bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent drop-shadow-lg">
                  Cho tương lai
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/95 leading-relaxed max-w-2xl font-light">
                Hãy tham gia cuộc cách mạng với mạng lưới sạc <span className="font-bold text-tertiary glow-text">tích hợp AI</span> của chúng tôi. 
                <span className="text-accent">Định tuyến thông minh</span>, <span className="text-secondary">dự đoán khả năng sẵn có</span>, và <span className="text-primary-glow">thanh toán liền mạch</span> – tất cả trên một nền tảng.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="group relative overflow-hidden"
                  onClick={() => window.location.href = '/login'}
                >
                  <span className="relative z-10">Bắt đầu ngay hôm nay</span>
                  <Zap className="w-5 h-5 group-hover:animate-bounce relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </Button>
                
                <Button 
                  variant="map" 
                  size="xl" 
                  className="group backdrop-blur-sm"
                  onClick={() => window.location.href = '/map'}
                >
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Khám phá mạng lưới
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              {/* Thống kê */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary-glow">500+</div>
                  <div className="text-sm text-white/80">Trạm sạc</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary-glow">99.9%</div>
                  <div className="text-sm text-white/80">Đảm bảo hoạt động</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary-glow">24/7</div>
                  <div className="text-sm text-white/80">Hỗ trợ thông minh</div>
                </div>
              </div>
            </div>

            {/* Hình ảnh Hero */}
            <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="relative">
                <div className="relative group">
                  <img 
                    src={heroImage} 
                    alt="Xe điện đang sạc tại trạm hiện đại"
                    className="w-full rounded-3xl shadow-glow animate-float group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-3xl"></div>
                </div>
                
                {/* Thẻ nổi */}
                <div className="absolute -top-6 -left-6 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-glow animate-float border border-primary/10" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center">
                      <Battery className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Tình trạng pin</p>
                      <p className="text-2xl font-bold text-primary">85%</p>
                      <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="w-4/5 h-full bg-gradient-hero rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-6 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-glow animate-float border border-accent/10" style={{ animationDelay: "1.5s" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Tình trạng mạng</p>
                      <p className="text-2xl font-bold text-accent">Trực tuyến</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Tất cả hệ thống hoạt động
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 -left-4 bg-gradient-hero/90 backdrop-blur-md rounded-xl p-3 shadow-glow animate-float" style={{ animationDelay: "2s" }}>
                  <div className="flex items-center gap-2 text-white">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-bold">4.9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chỉ báo cuộn */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Phần độ tin cậy */}
      <section className="py-16 bg-white border-b">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-4">Được tin tưởng bởi hàng nghìn tài xế trên toàn thế giới</h3>
            <div className="flex items-center justify-center gap-12 opacity-60">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-semibold">50K+ Người dùng</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">An toàn</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Luôn sẵn sàng</span>
              </div>
            </div>
          </div>
          
          {/* Lưới thống kê */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">2M+</div>
              <div className="text-sm text-muted-foreground">Phiên sạc</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">150kW</div>
              <div className="text-sm text-muted-foreground">Tốc độ trung bình</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">30s</div>
              <div className="text-sm text-muted-foreground">Thời gian thiết lập</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground">Tỷ lệ hài lòng</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
