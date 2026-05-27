import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { motion } from "framer-motion";
import { FiImage, FiMap, FiRefreshCcw } from "react-icons/fi";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";
import { apiUrl, clearSession } from "../../lib/api";

// HeatmapLayer Component
const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Scale intensity by duplicate points
    const pointCounts = {};
    points.forEach((p) => {
      const key = `${p.latitude},${p.longitude}`;
      pointCounts[key] = (pointCounts[key] || 0) + 1;
    });

    const heatPoints = points.map((p) => {
      const key = `${p.latitude},${p.longitude}`;
      return [p.latitude, p.longitude, Math.min(pointCounts[key], 5)]; // cap intensity at 5
    });

    const heat = L.heatLayer(heatPoints, {
      radius: 25, // more visible spread
      blur: 25,   // smooth edges
      maxZoom: 12 // max zoom for intensity effect
    }).addTo(map);

    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    } else {
      map.setView([22.9734, 78.6569], 17);
    }

    return () => map.removeLayer(heat);
  }, [map, points]);

  return null;
};

// Main Heatmap Component
const LeafletHeatmap = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState("satellite");
  const [errorMessage, setErrorMessage] = useState("");
  const [userLocation] = useState(null);
  const navigate = useNavigate();

  const fetchPoints = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await fetch(apiUrl("/api/complaints/heatmap"));
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to fetch heatmap data");
      setPoints((Array.isArray(data) ? data : []).filter((point) => Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude))));
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching heatmap data:", err);
      setErrorMessage("Unable to update heatmap data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const tileLayerUrl = useMemo(
    () =>
      viewMode === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    [viewMode]
  );

  return (
    <>
      {/* Header */}
      <div className="premium-nav fixed top-0 left-0 w-full h-24 flex items-center justify-between px-8 z-[1000]">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Logged in as</p>
            <p className="font-semibold text-gray-800">Admin</p>
          </div>
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="btn-secondary"
          >
            My Dashboard
          </button>
          <button
            onClick={() => {
              clearSession();
              navigate("/");
            }}
            className="btn-primary"
          >
            Logout
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="app-shell min-h-screen flex flex-col items-center pt-32 px-6 relative"
      >
        {/* Page Header */}
        <div className="max-w-5xl w-full text-center mb-10">
          <h1 className="text-4xl font-bold text-teal-900 mb-3">Grievance Density Map</h1>
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
            Review geographic concentration of public grievances to support department planning,
            prioritisation, and field response.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 w-full max-w-5xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800 shadow-sm">
            {errorMessage}
          </div>
        )}

        {/* Map Container */}
        <div className="w-full max-w-6xl shadow-xl border border-slate-200 rounded-lg overflow-hidden relative">
          <MapContainer
            center={userLocation || [22.9734, 78.6569]} // Center of India
            zoom={5}
            minZoom={4}
            maxZoom={18}
            style={{ height: "min(68vh, 680px)", minHeight: "420px", width: "100%" }}
            className="rounded-lg"
            zoomControl={false}
          >
            <TileLayer url={tileLayerUrl} />
            <HeatmapLayer points={points} />
          </MapContainer>

          {/* Floating Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-3 z-[600]">
            <button
              onClick={fetchPoints}
              disabled={loading}
              className="btn-secondary bg-white/90 p-3"
              title="Refresh Data"
              aria-label="Refresh heatmap data"
            >
              <FiRefreshCcw className={`text-lg ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() =>
                setViewMode(viewMode === "satellite" ? "street" : "satellite")
              }
              className="btn-secondary bg-white/90 p-3"
              title="Toggle View"
              aria-label="Toggle map view"
            >
              {viewMode === "satellite" ? <FiMap className="text-lg" /> : <FiImage className="text-lg" />}
            </button>
          </div>
        </div>

        {/* Footer Caption */}
        <div className="mt-6 text-center pb-10">
          {loading ? (
            <p className="text-sm text-gray-500 italic animate-pulse">
              Updating heatmap data...
            </p>
          ) : (
            <p className="text-xs text-gray-500 italic">
              Last updated: {lastUpdated || "just now"}
              <br />
              © {new Date().getFullYear()} Government of India Public Grievance Resolution Portal.
            </p>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default LeafletHeatmap;
