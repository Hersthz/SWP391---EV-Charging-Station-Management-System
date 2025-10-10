import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, MapPin } from "lucide-react";
import api from "../../api/axios";

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
}

const AdminAddStation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [stationData, setStationData] = useState<StationInput>({
    stationName: "",
    address: "",
    latitude: 0,
    longitude: 0,
    pillars: [],
  });

  // Add pillar
  const addPillar = () => {
    setStationData((prev) => ({
      ...prev,
      pillars: [
        ...prev.pillars,
        { code: "", power: 0, pricePerKwh: 0, connectors: [] },
      ],
    }));
  };

  // Remove pillar
  const removePillar = (index: number) => {
    setStationData((prev) => ({
      ...prev,
      pillars: prev.pillars.filter((_, i) => i !== index),
    }));
  };

  // Update pillar field
  const updatePillar = (index: number, field: keyof PillarInput, value: any) => {
    setStationData((prev) => ({
      ...prev,
      pillars: prev.pillars.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  // Add connector
  const addConnector = (pillarIndex: number) => {
    setStationData((prev) => ({
      ...prev,
      pillars: prev.pillars.map((p, i) =>
        i === pillarIndex
          ? { ...p, connectors: [...p.connectors, { connectorType: "" }] }
          : p
      ),
    }));
  };

  // Remove connector
  const removeConnector = (pillarIndex: number, connectorIndex: number) => {
    setStationData((prev) => ({
      ...prev,
      pillars: prev.pillars.map((p, i) =>
        i === pillarIndex
          ? {
              ...p,
              connectors: p.connectors.filter((_, ci) => ci !== connectorIndex),
            }
          : p
      ),
    }));
  };

  // Update connector
  const updateConnector = (
    pillarIndex: number,
    connectorIndex: number,
    type: string
  ) => {
    setStationData((prev) => ({
      ...prev,
      pillars: prev.pillars.map((p, i) =>
        i === pillarIndex
          ? {
              ...p,
              connectors: p.connectors.map((c, ci) =>
                ci === connectorIndex ? { connectorType: type } : c
              ),
            }
          : p
      ),
    }));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
    
      const response = await api.post("/charging-stations/addStation", stationData, {
      });

      console.log("Station created:", response.data);
      setSuccess(true);
      
      // Redirect after 2s
      setTimeout(() => {
        navigate("/admin/stations");
      }, 2000);
    } catch (err: any) {
      console.error("Create station error:", err);
      setError(err.response?.data?.message || "Failed to create station");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/stations")}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Add New Charging Station</h1>
            <p className="text-gray-600">
              Create a new station with pillars and connectors
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          ✓ Station created successfully! Redirecting...
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          ✗ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Station Info Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="w-5 h-5" />
            Station Information
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">
                Station Name *
              </label>
              <input
                required
                type="text"
                value={stationData.stationName}
                onChange={(e) =>
                  setStationData({ ...stationData, stationName: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Downtown Charging Hub"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Address *</label>
              <input
                required
                type="text"
                value={stationData.address}
                onChange={(e) =>
                  setStationData({ ...stationData, address: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 123 Main Street, District 1, HCMC"
              />
            </div>

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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10.7769"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Longitude *
              </label>
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="106.7009"
              />
            </div>
          </div>
        </div>

        {/* Pillars Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Charging Pillars</h3>
            <button
              type="button"
              onClick={addPillar}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Pillar
            </button>
          </div>

          {stationData.pillars.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No pillars added yet. Click "Add Pillar" to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {stationData.pillars.map((pillar, pIndex) => (
                <div
                  key={pIndex}
                  className="border-2 border-gray-200 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Pillar {pIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePillar(pIndex)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Code *
                      </label>
                      <input
                        required
                        type="text"
                        value={pillar.code}
                        onChange={(e) =>
                          updatePillar(pIndex, "code", e.target.value)
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="P1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Power (kW) *
                      </label>
                      <input
                        required
                        type="number"
                        value={pillar.power}
                        onChange={(e) =>
                          updatePillar(pIndex, "power", parseInt(e.target.value))
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="250"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Price ($/kWh) *
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={pillar.pricePerKwh}
                        onChange={(e) =>
                          updatePillar(
                            pIndex,
                            "pricePerKwh",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.65"
                      />
                    </div>
                  </div>

                  {/* Connectors */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Connectors</label>
                      <button
                        type="button"
                        onClick={() => addConnector(pIndex)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + Add Connector
                      </button>
                    </div>

                    {pillar.connectors.length === 0 ? (
                      <p className="text-sm text-gray-500">No connectors added</p>
                    ) : (
                      <div className="space-y-2">
                        {pillar.connectors.map((connector, cIndex) => (
                          <div key={cIndex} className="flex items-center gap-2">
                            <select
                              required
                              value={connector.connectorType}
                              onChange={(e) =>
                                updateConnector(pIndex, cIndex, e.target.value)
                              }
                              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select type</option>
                              <option value="CCS">CCS</option>
                              <option value="CHAdeMO">CHAdeMO</option>
                              <option value="Type2">Type 2</option>
                              <option value="AC">AC</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeConnector(pIndex, cIndex)}
                              className="p-2 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/stations")}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Station"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddStation;
