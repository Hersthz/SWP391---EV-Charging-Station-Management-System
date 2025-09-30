import { MapPin, Zap, CreditCard, Clock, Smartphone, Battery } from "lucide-react";
import { Card } from "../ui/card";

const Features = () => {
  const features = [
    {
      icon: MapPin,
      title: "Real-time station search",
      description: "Locate nearby charging stations with accurate status and pricing.",
      color: "text-primary"
    },
    {
      icon: Zap,
      title: "Fast-charging network",
      description: "Access a large fast-charging network with speeds up to 350kW.",
      color: "text-accent"
    },
    {
      icon: CreditCard,
      title: "Seamless payments",
      description: "Pay in-app with automatic invoices and detailed history.",
      color: "text-primary"
    },
    {
      icon: Clock,
      title: "Smart scheduling",
      description: "Book charging sessions in advance and get notified when a port is ready.",
      color: "text-accent"
    },
    {
      icon: Smartphone,
      title: "Remote monitoring",
      description: "Track your charging session remotely and get completion alerts.",
      color: "text-primary"
    },
    {
      icon: Battery,
      title: "Battery analytics",
      description: "Monitor battery health and charging habits to optimize performance.",
      color: "text-accent"
    }
  ];

  return (
    <section className="py-24 px-4 bg-gradient-section">
      <div className="container mx-auto max-w-7xl">
        {/* Section title */}
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary mb-4">
            <Zap className="w-6 h-6" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Powerful Features
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Everything you need for
            <span className="block text-primary">Smart EV Charging</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Our all-in-one platform gives you every tool you need to manage EV charging efficiently and conveniently.
          </p>
        </div>

        {/* Feature grid */}
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
