import Header from "../components/homepage/Header";
import Hero from "../components/homepage/Hero";
import Testimonials from "../components/homepage/Testimonials";
import Footer from "../components/homepage/Footer";
import Features from "../components/homepage/Features";
import MapPreview from "../components/homepage/MapPreview";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <MapPreview />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;