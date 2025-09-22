import Header from "../components/Header";
import Hero from "../components/Hero";
import Testimonials from "../components/Testimonials";
import Footer from "../components/Footer";
import Features from "../components/Features";
import MapPreview from "../components/MapPreview";

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