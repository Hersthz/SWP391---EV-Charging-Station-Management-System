import { Zap, MapPin, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Thương hiệu */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">ChargeStation</span>
            </div>
            <p className="text-background/70 leading-relaxed">
              Tiếp sức cho hành trình điện của bạn với giải pháp sạc thông minh trên toàn quốc.
            </p>
          </div>

          {/* Liên kết nhanh */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Liên kết nhanh</h3>
            <ul className="space-y-2 text-background/70">
              <li><a href="#" className="hover:text-primary-glow transition-colors">Tìm trạm</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-colors">Bảng giá</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-colors">Ứng dụng di động</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-colors">Hỗ trợ</a></li>
            </ul>
          </div>

          {/* Dịch vụ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dịch vụ</h3>
            <ul className="space-y-2 text-background/70">
              <li><a href="#" className="hover:text-primary-glow transition-colors">Sạc nhanh</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-colors">Quản lý đội xe</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-colors">Giải pháp doanh nghiệp</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-colors">Truy cập API</a></li>
            </ul>
          </div>

          {/* Liên hệ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Liên hệ</h3>
            <div className="space-y-3 text-background/70">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary-glow" />
                <span>support@chargestation.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary-glow" />
                <span>1-800-CHARGE-NOW</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary-glow" />
                <span>Phủ sóng toàn quốc</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 text-center text-background/70">
          <p>&copy; 2025 ChargeStation. Bản quyền đã được bảo hộ. Tiếp sức cho tương lai giao thông.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
