import React, { useState, useEffect } from "react";
import axios from "../../axios";
import { FaSave } from "react-icons/fa";

const ToggleSwitch = ({ enabled, onChange }) => {
  return (
    <div
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex items-center h-6 rounded-full w-12 cursor-pointer transition-colors duration-200 ease-in-out ${
        enabled ? "bg-brand-primary" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`inline-block w-5 h-5 transform bg-white rounded-full shadow transition-transform duration-200 ease-in-out ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </div>
  );
};

export default function TeamSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    axios
      .get("/auth/tenant/settings")
      .then((res) => {
        setSettings(res.data.data.settings);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch settings", err);
        setError("Could not load current team settings.");
        setLoading(false);
      });
  }, []);

  const handleToggleChange = (strategy) => {
    setSettings((prev) => ({ ...prev, leadDistributionStrategy: strategy }));
  };

  const handleSaveChanges = () => {
    setSuccess("");
    setError("");
    axios
      .put("/auth/tenant/settings", { settings })
      .then(() => {
        setSuccess("Settings saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to save settings.");
      });
  };

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">⚙️ Team Settings</h1>

      <div className="card p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Lead Distribution</h2>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Automatic Round-Robin Assignment</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              When enabled, new leads from WhatsApp will be automatically
              assigned to your sales team in a rotating sequence.
            </p>
          </div>
          <ToggleSwitch
            enabled={settings?.leadDistributionStrategy === "round-robin"}
            onChange={(isEnabled) =>
              handleToggleChange(isEnabled ? "round-robin" : "manual")
            }
          />
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center gap-4">
          {success && <p className="text-green-600 font-medium">{success}</p>}
          <button onClick={handleSaveChanges} className="btn primary flex items-center">
            <FaSave className="mr-2" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
