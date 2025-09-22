import { Zap, MapPin, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">ChargeStation</span>
            </div>
            <p className="text-background/70 leading-relaxed">
              Powering your electric journey with smart charging solutions nationwide.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-background/70">
              <li><a href="#" className="hover:text-primary-glow transition-colors">Find Stations</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-colors">Mobile App</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services</h3>
            <ul className="space-y-2 text-background/70">
              <li><a href="#" className="hover:text-primary-glow transition-colors">Fast Charging</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-colors">Fleet Management</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-colors">Business Solutions</a></li>
              <li><a href="#" className="hover:text-primary-glow transition-colors">API Access</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
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
                <span>Nationwide Coverage</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 text-center text-background/70">
          <p>&copy; 2025 ChargeStation. All rights reserved. Powering the future of transportation.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;