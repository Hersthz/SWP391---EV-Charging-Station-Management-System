import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { MapPin, Navigation, Zap, Clock } from "lucide-react";

const MapPreview = () => {
  const nearbyStations = [
    {
      name: "Trạm Trung tâm #3",
      distance: "0.2 km",
      availability: "4/6 Còn trống",
      status: "Trực tuyến",
      charging: "150kW • Sạc nhanh",
      price: "$0.45/kWh"
    },
    {
      name: "Trạm TTTM #2",
      distance: "0.8 km",
      availability: "2/4 Còn trống",
      status: "Trực tuyến",
      charging: "250kW • Siêu nhanh",
      price: "$0.52/kWh"
    },
    {
      name: "Trạm Cao tốc #7",
      distance: "2.1 km",
      availability: "6/8 Còn trống",
      status: "Trực tuyến",
      charging: "350kW • Cực nhanh",
      price: "$0.48/kWh"
    }
  ];

  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Xem trước Bản đồ */}
          <div className="relative animate-fade-in">
            <div className="relative bg-gradient-to-br from-primary/5 to-accent/10 rounded-2xl p-8 shadow-card">
              {/* Giao diện bản đồ mô phỏng */}
              <div className="bg-primary/5 rounded-xl h-96 flex items-center justify-center relative overflow-hidden">
                {/* Họa tiết nền bản đồ */}
                <div className="absolute inset-0 opacity-10">
                  <div className="grid grid-cols-8 h-full">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className="border border-primary/20"></div>
                    ))}
                  </div>
                </div>

                {/* Ghim vị trí */}
                <div className="relative z-10 flex flex-col items-center animate-float">
                  <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center shadow-glow">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center mt-4">
                    <p className="text-primary font-semibold">Bản đồ tương tác</p>
                    <p className="text-sm text-muted-foreground">Vị trí trạm sạc và tình trạng theo thời gian thực</p>
                  </div>
                </div>

                {/* Dấu trạm nổi */}
                <div className="absolute top-6 right-8 w-4 h-4 bg-accent rounded-full animate-pulse"></div>
                <div className="absolute bottom-12 left-12 w-4 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
                <div className="absolute top-16 left-16 w-4 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: "1s" }}></div>
              </div>

              {/* Thanh tìm kiếm mô phỏng */}
              <div className="mt-6 bg-white rounded-lg p-4 shadow-card flex items-center gap-3">
                <Navigation className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Tìm theo vị trí, tên trạm, hoặc tính năng...</span>
              </div>
            </div>
          </div>

          {/* Nội dung & danh sách trạm */}
          <div className="space-y-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <MapPin className="w-6 h-6" />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  Trạm gần bạn
                </span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                Tìm & Dẫn đường đến
                <span className="block text-primary">Bất kỳ trạm sạc nào</span>
              </h2>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Khám phá các trạm sạc gần bạn với tình trạng theo thời gian thực,
                giá và thông tin chi tiết để lên kế hoạch hành trình hiệu quả.
              </p>
            </div>

            {/* Danh sách trạm */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Tìm thấy 7 trạm trong bán kính 10km</h3>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>Dữ liệu thời gian thực</span>
                </div>
              </div>

              {nearbyStations.map((station, index) => (
                <Card
                  key={index}
                  className="p-6 bg-gradient-card border-0 shadow-card hover:shadow-primary transition-all duration-300 group animate-fade-in"
                  style={{ animationDelay: `${(index + 2) * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {station.name}
                        </h4>
                        <span className="text-sm text-muted-foreground">cách {station.distance}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-primary">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span>{station.availability}</span>
                        </div>
                        <div className="flex items-center gap-1 text-accent">
                          <Zap className="w-3 h-3" />
                          <span>{station.charging}</span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{station.price}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Clock className="w-4 h-4" />
                        Đặt chỗ
                      </Button>
                      <Button variant="map" size="sm">
                        <Navigation className="w-4 h-4" />
                        Dẫn đường
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button variant="hero" size="lg" className="w-full sm:w-auto">
              <MapPin className="w-5 h-5" />
              Xem toàn bộ bản đồ
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapPreview;
