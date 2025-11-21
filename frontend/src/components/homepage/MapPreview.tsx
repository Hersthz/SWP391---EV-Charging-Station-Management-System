"use client";
import { motion } from "framer-motion";
import { ThreeDImageRing } from "../lightswind/3d-image-ring";

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

export default function MapPreview() {
  return (
    <section
      id="image"
      className="relative bg-slate-100 min-h-screen flex items-center justify-center"
    >
      <div className="relative w-full max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full h-[480px] md:h-[560px] flex items-center justify-center"
        >
          <div className="absolute -z-10 inset-0 opacity-30">
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_center_left,rgba(16,185,129,0.35),transparent_55%),radial-gradient(ellipse_at_center_right,rgba(6,182,212,0.35),transparent_55%)]" />
          </div>
          
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
      </div>
    </section>
  );
}
