import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Zap, MapPin, Battery, Shield, Clock, Star, Users, TrendingUp, ArrowRight, Play } from "lucide-react";
import heroImage from "../assets/hero-charging.jpg";
import heroBackground from "../assets/hero-background.jpg";

const Hero = () => {
  return (
    <>
      {/* Main Hero Section */}
      <section 
        className="min-h-screen flex items-center justify-center py-20 px-4 pt-36 relative overflow-hidden"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Enhanced Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/65 to-accent/75 backdrop-blur-[1px]"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-glow/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-primary-glow/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "4s" }}></div>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Enhanced Hero Content */}
            <div className="text-white space-y-8 animate-fade-in">
              <div className="flex items-center gap-3 text-primary-glow mb-6">
                <div className="w-8 h-8 bg-primary-glow/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-widest">
                  Future of EV Charging
                </span>
                <Badge variant="secondary" className="bg-primary-glow/20 text-primary-glow border-primary-glow/30">
                  V2.0
                </Badge>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight">
                <span className="block bg-gradient-to-r from-white via-primary-glow to-white bg-clip-text text-transparent">
                  Power Up
                </span>
                <span className="block text-primary-glow drop-shadow-lg">
                  Your Future
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl font-light">
                Join the revolution with our <span className="font-semibold text-primary-glow">AI-powered</span> charging network. 
                Smart routing, predictive availability, and seamless payments - all in one platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="group relative overflow-hidden"
                  onClick={() => window.location.href = '/login'}
                >
                  <span className="relative z-10">Get Started Today</span>
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
                  Explore Network
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              {/* Enhanced Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary-glow">500+</div>
                  <div className="text-sm text-white/80">Charging Stations</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary-glow">99.9%</div>
                  <div className="text-sm text-white/80">Uptime Guarantee</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary-glow">24/7</div>
                  <div className="text-sm text-white/80">Smart Support</div>
                </div>
              </div>
            </div>

            {/* Enhanced Hero Visual */}
            <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="relative">
                {/* Main Image with enhanced effects */}
                <div className="relative group">
                  <img 
                    src={heroImage} 
                    alt="Electric vehicle charging at a modern charging station"
                    className="w-full rounded-3xl shadow-glow animate-float group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-3xl"></div>
                </div>
                
                {/* Enhanced Floating Cards */}
                <div className="absolute -top-6 -left-6 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-glow animate-float border border-primary/10" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center">
                      <Battery className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Battery Status</p>
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
                      <p className="text-sm text-muted-foreground font-medium">Network Status</p>
                      <p className="text-2xl font-bold text-accent">Live</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        All systems operational
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Floating Element */}
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

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-16 bg-white border-b">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-4">Trusted by thousands of drivers worldwide</h3>
            <div className="flex items-center justify-center gap-12 opacity-60">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-semibold">50K+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Always Available</span>
              </div>
            </div>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">2M+</div>
              <div className="text-sm text-muted-foreground">Charging Sessions</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">150kW</div>
              <div className="text-sm text-muted-foreground">Average Speed</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">30s</div>
              <div className="text-sm text-muted-foreground">Setup Time</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;