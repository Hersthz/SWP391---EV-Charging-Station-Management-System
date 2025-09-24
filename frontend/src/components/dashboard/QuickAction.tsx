import { Map, Zap, Wallet, History, Settings, HeadphonesIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Hành động nhanh</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Find & Start Charging */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-3 bg-blue-500 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-blue-900">Bắt đầu sạc</h3>
                <p className="text-sm text-blue-700">
                  Tìm trạm và bắt đầu sạc ngay
                </p>
              </div>
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={() => navigate("/map")}
              >
                Sạc ngay
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* View Map */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-3 bg-green-500 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-green-900">Xem bản đồ</h3>
                <p className="text-sm text-green-700">
                  Khám phá các trạm sạc gần bạn
                </p>
              </div>
              <Button 
                variant="outline"
                className="w-full border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => navigate("/map")}
              >
                Mở bản đồ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Wallet & Payment */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-3 bg-purple-500 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-purple-900">Ví & Thanh toán</h3>
                <p className="text-sm text-purple-700">
                  Quản lý số dư và lịch sử giao dịch
                </p>
              </div>
              <Button 
                variant="outline"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                Xem ví
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charging History */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-3 bg-orange-500 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-orange-900">Lịch sử sạc</h3>
                <p className="text-sm text-orange-700">
                  Xem các phiên sạc trước đây
                </p>
              </div>
              <Button 
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={() => navigate("/reports")}
              >
                Xem lịch sử
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-3 bg-gray-500 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Cài đặt</h3>
                <p className="text-sm text-gray-700">
                  Tùy chỉnh tài khoản và thông báo
                </p>
              </div>
              <Button 
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cài đặt
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-3 bg-teal-500 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <HeadphonesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-teal-900">Hỗ trợ 24/7</h3>
                <p className="text-sm text-teal-700">
                  Liên hệ khi cần trợ giúp
                </p>
              </div>
              <Button 
                variant="outline"
                className="w-full border-teal-300 text-teal-700 hover:bg-teal-50"
              >
                Liên hệ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickActions;