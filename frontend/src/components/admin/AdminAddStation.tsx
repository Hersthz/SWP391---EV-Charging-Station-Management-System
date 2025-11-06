// src/pages/admin/AdminAddStation.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  ArrowLeft,
  MapPin,
  Crosshair,
  Building2,
} from "lucide-react";
import api from "../../api/axios";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

// Map
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix default marker icons for Leaflet in bundlers
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface ConnectorInput {
  connectorType: string;
}
interface PillarInput {
  code: string;
  power: number;
  pricePerKwh: number;
  connectors: ConnectorInput[];
}
interface StationInput {
  stationName: string;
  address: string;
  latitude: number;
  longitude: number;
  pillars: PillarInput[];
  imageUrl?: string;     // public image URL
  imageBase64?: string;  // base64 when a local file is uploaded
}

const connectorOptions = ["CCS", "CHAdeMO", "Type2", "AC"] as const;

function isValidNumber(n: unknown) {
  return typeof n === "number" && !Number.isNaN(n);
}

function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  // click on map to update
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const AdminAddStation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [stationData, setStationData] = useState<StationInput>({
    stationName: "",
    address: "",
    latitude: 10.7769, // default HCMC center
    longitude: 106.7009,
    pillars: [],
  });

  // image preview source 
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // ===== Pillars =====
  const addPillar = () => {
    setStationData((prev) => ({
      ...prev,
      pillars: [
        ...prev.pillars,
        { code: "", power: 0, pricePerKwh: 0, connectors: [] },
      ],
    }));
  };

  const removePillar = (index: number) => {
    setStationData((prev) => ({
      ...prev,
      pillars: prev.pillars.filter((_, i) => i !== index),
    }));
  };

  const updatePillar = (index: number, field: keyof PillarInput, value: any) => {
    setStationData((prev) => ({
      ...prev,
      pillars: prev.pillars.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  // ===== Connectors =====
  const addConnector = (pillarIndex: number) => {
    setStationData((prev) => ({
      ...prev,
      pillars: prev.pillars.map((p, i) =>
        i === pillarIndex ? { ...p, connectors: [...p.connectors, { connectorType: "" }] } : p
      ),
    }));
  };

  const removeConnector = (pillarIndex: number, connectorIndex: number) => {
    setStationData((prev) => ({
      ...prev,
      pillars: prev.pillars.map((p, i) =>
        i === pillarIndex
          ? { ...p, connectors: p.connectors.filter((_, ci) => ci !== connectorIndex) }
          : p
      ),
    }));
  };

  const updateConnector = (pillarIndex: number, connectorIndex: number, type: string) => {
    setStationData((prev) => ({
      ...prev,
      pillars: prev.pillars.map((p, i) =>
        i === pillarIndex
          ? {
              ...p,
              connectors: p.connectors.map((c, ci) => (ci === connectorIndex ? { connectorType: type } : c)),
            }
          : p
      ),
    }));
  };

  // ===== Image handlers =====
  const handleImageUrlChange = (val: string) => {
    setStationData((prev) => ({ ...prev, imageUrl: val, imageBase64: undefined }));
    setPreviewSrc(val || null);
  };

  const handleFileChange = (file?: File | null) => {
    if (!file) {
      setStationData((prev) => ({ ...prev, imageBase64: undefined }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result);
      setStationData((prev) => ({ ...prev, imageBase64: base64, imageUrl: undefined }));
      setPreviewSrc(base64);
    };
    reader.readAsDataURL(file);
  };

  // ===== Form submit =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // basic validations
    if (!stationData.stationName.trim()) {
      setError("Station name is required.");
      setLoading(false);
      return;
    }
    if (!stationData.address.trim()) {
      setError("Address is required.");
      setLoading(false);
      return;
    }
    if (!isValidNumber(stationData.latitude) || !isValidNumber(stationData.longitude)) {
      setError("Latitude/Longitude is invalid.");
      setLoading(false);
      return;
    }
    if (stationData.pillars.length === 0) {
      setError("Please add at least one pillar.");
      setLoading(false);
      return;
    }

    try {
      const payload: StationInput = {
        ...stationData,
        latitude: Number(stationData.latitude),
        longitude: Number(stationData.longitude),
        pillars: stationData.pillars.map((p) => ({
          ...p,
          power: Number(p.power),
          pricePerKwh: Number(p.pricePerKwh),
        })),
        imageUrl: stationData.imageUrl?.trim() || undefined,
        imageBase64: stationData.imageBase64 || undefined,
      };

      const res = await api.post("/charging-stations/addStation", payload);
      console.log("Station created:", res.data);
      setSuccess(true);

      setTimeout(() => navigate("/admin/stations"), 1500);
    } catch (err: any) {
      console.error("Create station error:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          "Failed to create station"
      );
    } finally {
      setLoading(false);
    }
  };

  // ===== Geolocation (optional helper) =====
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStationData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
      },
      (err) => {
        setError(err.message || "Unable to get current location.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const onCancel = () => {
    setPreviewSrc(null);
    navigate("/admin/stations");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/stations")}
            className="hover:bg-sky-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-sky-500 to-emerald-500">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Add New Charging Station
            </span>
          </div>

          <Badge variant="outline" className="px-3 py-2">
            Admin
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Alerts */}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3">
            ✓ Station created successfully! Redirecting…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3">
            ✗ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Station Info */}
          <Card className="bg-white/80 backdrop-blur border-sky-200/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-100">
                  <MapPin className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <CardTitle>Station Information</CardTitle>
                  <CardDescription>Create a new station with pillars and connectors</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Station Name *</label>
                  <input
                    required
                    type="text"
                    value={stationData.stationName}
                    onChange={(e) =>
                      setStationData({ ...stationData, stationName: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g., Downtown Charging Hub"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Address *</label>
                  <input
                    required
                    type="text"
                    value={stationData.address}
                    onChange={(e) =>
                      setStationData({ ...stationData, address: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g., 123 Main Street, District 1, HCMC"
                  />
                </div>

                {/* Map block */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Pick location on the map (click or drag marker). You can still edit coordinates manually.
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={useMyLocation}
                      className="gap-2"
                    >
                      <Crosshair className="w-4 h-4" />
                      Use my location
                    </Button>
                  </div>

                  <div className="rounded-xl overflow-hidden border">
                    <MapContainer
                      center={[stationData.latitude, stationData.longitude]}
                      zoom={15}
                      style={{ height: 360, width: "100%" }}
                      scrollWheelZoom
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationPicker
                        lat={stationData.latitude}
                        lng={stationData.longitude}
                        onChange={(lat, lng) =>
                          setStationData({ ...stationData, latitude: lat, longitude: lng })
                        }
                      />
                      <Marker
                        position={[stationData.latitude, stationData.longitude]}
                        draggable
                        eventHandlers={{
                          dragend: (e: any) => {
                            const m = e.target as L.Marker;
                            const ll = m.getLatLng();
                            setStationData({
                              ...stationData,
                              latitude: Number(ll.lat.toFixed(6)),
                              longitude: Number(ll.lng.toFixed(6)),
                            });
                          },
                        }}
                      />
                    </MapContainer>
                  </div>

                  {/* Manual inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Latitude *</label>
                      <input
                        required
                        type="number"
                        step="any"
                        value={stationData.latitude}
                        onChange={(e) =>
                          setStationData({
                            ...stationData,
                            latitude: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="10.7769"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Longitude *</label>
                      <input
                        required
                        type="number"
                        step="any"
                        value={stationData.longitude}
                        onChange={(e) =>
                          setStationData({
                            ...stationData,
                            longitude: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="106.7009"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Station Image */}
          <Card className="bg-white/80 backdrop-blur border-sky-200/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100">
                  <img
                    alt="image icon"
                    src="https://cdn-icons-png.flaticon.com/512/3342/3342137.png"
                    className="w-5 h-5"
                  />
                </div>
                <div>
                  <CardTitle>Station Image (optional)</CardTitle>
                  <CardDescription>Paste an image URL or upload a local file</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input
                    type="url"
                    value={stationData.imageUrl ?? ""}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="https://example.com/station.jpg"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Prefer a public CDN/S3 URL for best performance.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Upload file</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                    className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    When a file is chosen, a <code>imageBase64</code> will be sent.
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-2">
                <label className="block text-sm font-medium mb-2">Preview</label>
                <div className="rounded-xl border overflow-hidden bg-slate-50 grid place-items-center min-h-[180px]">
                  {previewSrc ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <img src={previewSrc} className="max-h-[280px] w-full object-contain" loading="lazy" />
                  ) : (
                    <span className="text-sm text-slate-500 py-8">No image selected</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pillars */}
          <Card className="bg-white/80 backdrop-blur border-sky-200/60">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Charging Pillars</CardTitle>
                <CardDescription>Configure power, price and connectors</CardDescription>
              </div>
              <Button
                type="button"
                onClick={addPillar}
                className="gap-2 bg-gradient-to-r from-sky-500 to-emerald-500 hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Add Pillar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {stationData.pillars.length === 0 ? (
                <div className="text-center text-slate-500 py-6">
                  No pillars added yet. Click <span className="font-medium">Add Pillar</span> to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {stationData.pillars.map((pillar, pIndex) => (
                    <div key={pIndex} className="border rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-sm font-medium">
                          Pillar {pIndex + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removePillar(pIndex)}
                          className="hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Code *</label>
                          <input
                            required
                            type="text"
                            value={pillar.code}
                            onChange={(e) => updatePillar(pIndex, "code", e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            placeholder="AC-01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Power (kW) *</label>
                          <input
                            required
                            type="number"
                            min={0}
                            value={pillar.power}
                            onChange={(e) =>
                              updatePillar(pIndex, "power", parseFloat(e.target.value))
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            placeholder="250"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Price (₫/kWh) *</label>
                          <input
                            required
                            type="number"
                            min={0}
                            step={100}
                            value={pillar.pricePerKwh}
                            onChange={(e) =>
                              updatePillar(pIndex, "pricePerKwh", parseFloat(e.target.value))
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            placeholder="6500"
                          />
                        </div>
                      </div>

                      {/* Connectors */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">Connectors</label>
                          <Button type="button" variant="outline" size="sm" onClick={() => addConnector(pIndex)}>
                            + Add Connector
                          </Button>
                        </div>

                        {pillar.connectors.length === 0 ? (
                          <p className="text-sm text-slate-500">No connectors added</p>
                        ) : (
                          <div className="space-y-2">
                            {pillar.connectors.map((connector, cIndex) => (
                              <div key={cIndex} className="flex items-center gap-2">
                                <select
                                  required
                                  value={connector.connectorType}
                                  onChange={(e) => updateConnector(pIndex, cIndex, e.target.value)}
                                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                >
                                  <option value="">Select type</option>
                                  {connectorOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => removeConnector(pIndex, cIndex)}
                                  className="hover:bg-rose-50"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Station"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AdminAddStation;
