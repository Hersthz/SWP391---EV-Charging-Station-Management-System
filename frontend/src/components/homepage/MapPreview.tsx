import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { MapPin, Navigation, Zap, Clock } from "lucide-react";

const MapPreview = () => {
  const nearbyStations = [
    {
      name: "Central Station #3",
      distance: "0.2 km",
      availability: "4/6 Available",
      status: "Online",
      charging: "150kW • Fast charge",
      price: "$0.45/kWh"
    },
    {
      name: "Mall Station #2",
      distance: "0.8 km",
      availability: "2/4 Available",
      status: "Online",
      charging: "250kW • Ultra fast",
      price: "$0.52/kWh"
    },
    {
      name: "Highway Station #7",
      distance: "2.1 km",
      availability: "6/8 Available",
      status: "Online",
      charging: "350kW • Hyper fast",
      price: "$0.48/kWh"
    }
  ];

  return (
    <section className="py-24 px-4 bg-background" id="map">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Map mock */}
          <div className="relative animate-fade-in">
            <div className="relative bg-gradient-to-br from-primary/5 to-accent/10 rounded-2xl p-8 shadow-card">
              <div className="bg-primary/5 rounded-xl h-96 flex items-center justify-center relative overflow-hidden">
                {/* Map pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="grid grid-cols-8 h-full">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className="border border-primary/20"></div>
                    ))}
                  </div>
                </div>

                {/* Pin */}
                <div className="relative z-10 flex flex-col items-center animate-float">
                  <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center shadow-glow">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center mt-4">
                    <p className="text-primary font-semibold">Interactive map</p>
                    <p className="text-sm text-muted-foreground">Station locations and live status</p>
                  </div>
                </div>

                {/* Station dots */}
                <div className="absolute top-6 right-8 w-4 h-4 bg-accent rounded-full animate-pulse"></div>
                <div className="absolute bottom-12 left-12 w-4 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
                <div className="absolute top-16 left-16 w-4 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: "1s" }}></div>
              </div>

              {/* Search bar mock */}
              <div className="mt-6 bg-white rounded-lg p-4 shadow-card flex items-center gap-3">
                <Navigation className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Search by location, station name, or feature...</span>
              </div>
            </div>
          </div>

          {/* Content & list */}
          <div className="space-y-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <MapPin className="w-6 h-6" />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  Stations near you
                </span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                Find & Navigate to
                <span className="block text-primary">Any Charging Station</span>
              </h2>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Discover nearby stations with real-time availability, pricing, and details to plan your trips efficiently.
              </p>
            </div>

            {/* Station list */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Found 7 stations within 10km</h3>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>Live data</span>
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
                        <span className="text-sm text-muted-foreground">~ {station.distance}</span>
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
                        Reserve
                      </Button>
                      <Button variant="map" size="sm">
                        <Navigation className="w-4 h-4" />
                        Navigate
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button variant="hero" size="lg" className="w-full sm:w-auto">
              <MapPin className="w-5 h-5" />
              View full map
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapPreview;
