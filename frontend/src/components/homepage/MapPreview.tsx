"use client";
import { motion } from "framer-motion";
import { MapPin, Navigation2, Clock, Zap, Search } from "lucide-react";
import { ThreeDImageRing } from "../lightswind/3d-image-ring";
import { Button } from "../ui/button"; 

const EV_RING_IMAGES = [
  "https://greencharge.vn/wp-content/uploads/2023/04/greencharge-33.jpg",
  "https://tse3.mm.bing.net/th/id/OIP.g4YsSzaUyvKvnlWnJdY6egHaE8?rs=1&pid=ImgDetMain&o=7&rm=3",
  "https://storage.googleapis.com/f1-cms/2021/06/152fc08c-20210602_090454.jpg",
  "https://static.automotor.vn/images/upload/2025/05/29/chinh-sach-tram-sac-xe-dien-vneconomyautomotive-1.jpg",
  "https://static.automotor.vn/images/upload/2023/02/17/tram-sac-xe-dien-my-vneconomyautomotive4.jpeg",
  "https://tse4.mm.bing.net/th/id/OIP.TRNeEUrakNOE3gHV7Gn-5wHaFj?rs=1&pid=ImgDetMain&o=7&rm=3",
  "https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2021/9/15/953777/PR1_Anh-1.jpg",
  "https://evbattery.vn/wp-content/uploads/2023/04/tram-sac-xe-dien-4.jpg",
  "https://storage.googleapis.com/vinfast-data-01/tim-hieu-he-sinh-thai-tram-sac-xe-dien-vinfast-tren-toan-quoc-2_1624502818.jpg",
  "https://photo2.tinhte.vn/data/attachment-files/2022/10/6165471_E0E058FC-D632-4A72-AFD2-A5C875CCC2F8.jpeg",
];

const stations = [
  { name: "Central Station #3", distance: "~ 0.2 km", available: "4/6 Available", speed: "150kW • Fast", price: "$0.45/kWh" },
  { name: "Mall Station #2", distance: "~ 0.8 km", available: "2/4 Available", speed: "250kW • Ultra", price: "$0.52/kWh" },
  { name: "Highway Station #7", distance: "~ 2.1 km", available: "6/8 Available", speed: "350kW • Hyper", price: "$0.48/kWh" },
];

export default function MapPreview() {
  return (
    <section id="map" className="py-20 bg-slate-100">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full h-[450px] flex items-center justify-center"
          >
            <div className="absolute -z-10 inset-0 opacity-20">
              <div className="h-full w-full bg-[radial-gradient(ellipse_at_center_left,rgba(16,185,129,0.3),transparent_50%),radial-gradient(ellipse_at_center_right,rgba(6,182,212,0.3),transparent_50%)]" />
            </div>
            
            {/* 3D Ring  */}
            <ThreeDImageRing
              images={EV_RING_IMAGES}
              width={400}
              imageDistance={650} 
              mobileScaleFactor={0.7}
              backgroundColor="transparent" 
              containerClassName="!h-[450px]"
              imageClassName="rounded-2xl shadow-xl"
            />
          </motion.div>

          <div className="space-y-6">
            {/* Tiêu đề */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 grid place-items-center text-white shadow-lg shadow-cyan-500/30">
                  <MapPin />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">Stations near you</h3>
                  <p className="text-slate-600">Live availability, pricing, and details to plan efficiently.</p>
                </div>
              </div>
            </motion.div>
            
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-3 rounded-2xl border border-slate-300 px-3 py-2 bg-white shadow-sm"
            >
              <Search className="size-5 text-slate-400" />
              <input className="w-full outline-none text-base bg-transparent text-slate-800" placeholder="Search by station, location, or feature..." />
              <Button className="rounded-xl shadow-lg shadow-cyan-500/30 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:brightness-110 text-white">
                View map
              </Button>
            </motion.div>

            {/* Station list */}
            <div className="space-y-4 pt-2">
              {stations.map((s, idx) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-semibold text-lg text-slate-900">{s.name}</div>
                    <div className="text-sm text-slate-500">{s.distance}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="flex items-center gap-1.5 text-blue-600 font-medium"><Clock className="size-4" />{s.available}</span>
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium"><Zap className="size-4" />{s.speed}</span>
                      <span className="text-slate-600">{s.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    <Button variant="outline" className="rounded-xl w-1/2 sm:w-auto border-slate-300 hover:bg-slate-50 text-slate-800">
                      Reserve
                    </Button>
                    <Button className="rounded-xl w-1/2 sm:w-auto gap-2 shadow-lg shadow-cyan-500/30 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:brightness-110 text-white">
                      <Navigation2 className="size-4" /> Navigate
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}